import { ConvexError } from "convex/values";
import type { Value } from "convex/values";
import type { EPaycoCredentials } from "./validators.js";

/**
 * Native (V8-runtime) implementation of the ePayco wire protocol.
 *
 * Convex components cannot use the Node.js runtime, so the official
 * `epayco-sdk-node` package (which depends on Node built-ins) cannot run here.
 * This module reproduces that SDK's exact request protocol using only Web
 * platform APIs (`fetch`, Web Crypto, `TextEncoder`):
 *
 *   - JWT login (`POST /v1/auth/login`) for `api.secure.payco.co` endpoints,
 *     and Basic-auth login (`POST /login`) for `apify.epayco.co` endpoints.
 *   - AES-128-CBC encryption (16-byte hex private key, all-zero IV, PKCS#7)
 *     for `secure.payco.co/restpagos` (PSE) endpoints, plus the
 *     `public_key` / `i` / `p` / `enpruebas` envelope the SDK emits.
 *   - Spanish field-name translation (`keylang`) for restpagos endpoints and
 *     camelCase translation (`keylang_apify`) for apify endpoints.
 *
 * Ported field-for-field from `epayco-sdk-node@1.4.4` `lib/resources/index.js`.
 */

const BASE_URL = "https://api.secure.payco.co";
const SECURE_URL = "https://secure.payco.co";
const APIFY_URL = "https://apify.epayco.co";

/** Upper bound for any ePayco API call, so a hung host can't block the action. */
const REQUEST_TIMEOUT_MS = 30_000;
/** Tighter bound for the best-effort ipify lookup on the payment hot path. */
const IP_LOOKUP_TIMEOUT_MS = 5_000;

/** Base64 of a 16-byte all-zero IV (`i` for the encrypted restpagos envelope). */
const ZERO_IV_BASE64 = "AAAAAAAAAAAAAAAAAAAAAA==";
/** Base64 of the ASCII string "0000000000000000" (`i` for the cash envelope). */
const CASH_IV_BASE64 = "MDAwMDAwMDAwMDAwMDAwMA==";

// keylang.json — SDK field name -> restpagos (Spanish) wire field name.
const KEYLANG: Record<string, string> = {
  bank: "banco",
  invoice: "factura",
  description: "descripcion",
  value: "valor",
  tax: "iva",
  ico: "ico",
  tax_base: "baseiva",
  currency: "moneda",
  type_person: "tipo_persona",
  doc_type: "tipo_doc",
  doc_number: "documento",
  name: "nombres",
  last_name: "apellidos",
  email: "email",
  country: "pais",
  department: "depto",
  city: "ciudad",
  phone: "telefono",
  cell_phone: "celular",
  address: "direccion",
  ip: "ip",
  url_response: "url_respuesta",
  url_confirmation: "url_confirmacion",
  method_confirmation: "method_confirmation",
  metodoconfirmacion: "metodoconfirmacion",
  end_date: "fechaexpiracion",
};

// keylang_apify.json — SDK field name -> apify (camelCase) wire field name.
const KEYLANG_APIFY: Record<string, string> = {
  cash: "cash",
  end_date: "expirationDate",
  ref_payco: "refPayco",
  id_session_token: "idSessionToken",
  otp: "otp",
  invoice: "invoice",
  description: "description",
  value: "value",
  tax: "tax",
  ico: "ico",
  tax_base: "taxBase",
  currency: "currency",
  doc_type: "docType",
  doc_number: "document",
  name: "name",
  last_name: "lastName",
  email: "email",
  ind_country: "indCountry",
  country: "country",
  city: "city",
  phone: "phone",
  address: "address",
  ip: "ip",
  test: "testMode",
  url_response: "urlResponse",
  url_confirmation: "urlConfirmation",
  method_confirmation: "methodConfirmation",
};

function langkey(key: string): string {
  return KEYLANG[key] ?? key;
}
function langkeyApify(key: string): string {
  return KEYLANG_APIFY[key] ?? key;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 3 <= bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + "==";
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + "=";
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function utf8ToBase64(str: string): string {
  return bytesToBase64(new TextEncoder().encode(str));
}

/**
 * AES-128-CBC encrypt a UTF-8 string with the hex private key and a zero IV,
 * returning Base64 ciphertext. Web Crypto applies PKCS#7 padding by default,
 * matching `crypto-js`'s `Pkcs7`. (A 16-byte/32-hex private key yields a valid
 * AES-128 key.)
 */
export async function aesEncrypt(
  value: string,
  privateKeyHex: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(privateKeyHex) as BufferSource,
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: new Uint8Array(16) as BufferSource },
    key,
    new TextEncoder().encode(value) as BufferSource,
  );
  return bytesToBase64(new Uint8Array(ciphertext));
}

export type EpaycoResponse = Record<string, unknown> & {
  success?: boolean;
  status?: boolean | string;
  titleResponse?: string;
  title_response?: string;
  textResponse?: string;
  text_response?: string;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
};

type Payload = Record<string, unknown>;

type RequestFlags = {
  sw?: boolean;
  cashData?: boolean;
  card?: boolean;
  apify?: boolean;
};

export interface EpaycoClient {
  token: { create(options: Payload): Promise<EpaycoResponse> };
  customers: {
    create(options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
    list(options?: Payload): Promise<EpaycoResponse>;
    update(uid: string, options: Payload): Promise<EpaycoResponse>;
    delete(options: Payload): Promise<EpaycoResponse>;
    addDefaultCard(options: Payload): Promise<EpaycoResponse>;
    addNewToken(options: Payload): Promise<EpaycoResponse>;
  };
  plans: {
    create(options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
    list(): Promise<EpaycoResponse>;
    update(uid: string, options: Payload): Promise<EpaycoResponse>;
    delete(uid: string): Promise<EpaycoResponse>;
  };
  subscriptions: {
    create(options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
    list(): Promise<EpaycoResponse>;
    cancel(uid: string): Promise<EpaycoResponse>;
    charge(options: Payload): Promise<EpaycoResponse>;
  };
  charge: {
    create(options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
  };
  bank: {
    create(options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
    getBanks(): Promise<EpaycoResponse>;
  };
  cash: {
    create(type: string, options: Payload): Promise<EpaycoResponse>;
    get(uid: string): Promise<EpaycoResponse>;
  };
  daviplata: {
    create(options: Payload): Promise<EpaycoResponse>;
    confirm(options: Payload): Promise<EpaycoResponse>;
  };
  safetypay: { create(options: Payload): Promise<EpaycoResponse> };
}

/**
 * Build an ePayco client bound to a set of credentials. Mirrors the resource
 * method surface of `epayco-sdk-node` so the resource action files are written
 * against the same API.
 */
export function getEpaycoClient(credentials: EPaycoCredentials): EpaycoClient {
  const apiKey = credentials.apiKey;
  const privateKey = credentials.privateKey;
  const test = credentials.testMode ?? false ? "TRUE" : "FALSE";

  async function authenticate(apify: boolean): Promise<string> {
    if (apify) {
      const basic = utf8ToBase64(`${apiKey}:${privateKey}`);
      const res = await fetch(`${APIFY_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The trailing ";" is intentional: it matches epayco-sdk-node@1.4.4
          // (lib/resources/index.js) exactly, which the apify host expects.
          Authorization: `Basic ${basic};`,
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const json = (await res.json()) as Record<string, unknown>;
      return String(json.token ?? json.bearer_token ?? "");
    }
    const res = await fetch(`${BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_key: apiKey, private_key: privateKey }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const json = (await res.json()) as Record<string, unknown>;
    return String(json.bearer_token ?? json.token ?? "");
  }

  async function setData(
    data: Payload,
    cashData: boolean,
    apify: boolean,
  ): Promise<Payload> {
    const set: Payload = {};
    if (apify) {
      for (const key of Object.keys(data)) {
        set[langkeyApify(key)] = data[key];
      }
      return set;
    }
    if (cashData) {
      for (const key of Object.keys(data)) {
        set[langkey(key)] = data[key];
      }
      set.public_key = apiKey;
      set.i = CASH_IV_BASE64;
      set.enpruebas = test;
      set.lenguaje = "javascript";
      set.p = "";
      return set;
    }
    // Encrypted (PSE) path.
    for (const key of Object.keys(data)) {
      const value = data[key];
      if (key.includes("extras_epayco") && value && typeof value === "object") {
        const extra5 = (value as Record<string, unknown>).extra5;
        set[langkey(key)] = {
          extra5: await aesEncrypt(String(extra5 ?? ""), privateKey),
        };
      } else {
        set[langkey(key)] = await aesEncrypt(String(value), privateKey);
      }
    }
    set.public_key = apiKey;
    set.i = ZERO_IV_BASE64;
    set.enpruebas = await aesEncrypt(test, privateKey);
    set.lenguaje = "javascript";
    set.p = bytesToBase64(hexToBytes(privateKey));
    return set;
  }

  async function request(
    method: "get" | "post",
    path: string,
    data: Payload,
    flags: RequestFlags = {},
  ): Promise<EpaycoResponse> {
    const { sw = false, cashData = false, card = false, apify = false } = flags;
    const bearer = `Bearer ${await authenticate(apify)}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      type: "sdk-jwt",
      lang: "NODE",
      Authorization: bearer,
    };

    const base = apify ? APIFY_URL : sw ? SECURE_URL : BASE_URL;
    const url = base + path;

    if (method === "get") {
      const res = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      return parseResponse(res);
    }

    let body: Payload = { ...data, extras_epayco: { extra5: "P44" } };
    if (!card) {
      body.test = test;
      if (body.ip === undefined) {
        const ip = await fetchServerIp();
        if (ip) body.ip = ip;
      }
    }
    if (sw || apify) {
      body = await setData(body, cashData, apify);
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return parseResponse(res);
  }

  const txLookup = (uid: string) =>
    request(
      "get",
      `/restpagos/transaction/response.json?ref_payco=${encodeURIComponent(uid)}&&public_key=${apiKey}`,
      {},
      { sw: true },
    );

  return {
    token: {
      create: (options) => request("post", "/v1/tokens", options),
    },
    customers: {
      create: (options) =>
        request("post", "/payment/v1/customer/create", options),
      get: (uid) =>
        request("get", `/payment/v1/customer/${apiKey}/${uid}`, {}),
      list: (options) =>
        request("get", buildListUrl("/payment/v1/customers", options), {}, {
          card: true,
        }),
      update: (uid, options) =>
        request("post", `/payment/v1/customer/edit/${apiKey}/${uid}`, options),
      delete: (options) => request("post", "/v1/remove/token", options),
      addDefaultCard: (options) =>
        request("post", "/payment/v1/customer/reasign/card/default", options, {
          card: true,
        }),
      addNewToken: (options) =>
        request("post", "/v1/customer/add/token", options, { card: true }),
    },
    plans: {
      create: (options) => request("post", "/recurring/v1/plan/create", options),
      get: (uid) => request("get", `/recurring/v1/plan/${apiKey}/${uid}`, {}),
      list: () => request("get", `/recurring/v1/plans/${apiKey}`, {}),
      update: (uid, options) =>
        request("post", `/recurring/v1/plan/edit/${uid}`, options),
      delete: (uid) =>
        request("post", `/recurring/v1/plan/remove/${apiKey}/${uid}`, {}),
    },
    subscriptions: {
      create: (options) =>
        request("post", "/recurring/v1/subscription/create", options),
      get: (uid) =>
        request("get", `/recurring/v1/subscription/${uid}/${apiKey}`, {}),
      list: () => request("get", `/recurring/v1/subscriptions/${apiKey}`, {}),
      cancel: (uid) =>
        request("post", "/recurring/v1/subscription/cancel", {
          id: uid,
          public_key: apiKey,
        }),
      charge: (options) =>
        request("post", "/payment/v1/charge/subscription/create", options),
    },
    charge: {
      create: (options) => request("post", "/payment/v1/charge/create", options),
      get: (uid) => txLookup(uid),
    },
    bank: {
      create: (options) =>
        request("post", "/restpagos/pagos/debitos.json", options, { sw: true }),
      get: (uid) =>
        request(
          "get",
          `/restpagos/pse/transactioninfomation.json?transactionID=${encodeURIComponent(uid)}&&public_key=${apiKey}`,
          {},
          { sw: true },
        ),
      getBanks: () =>
        request(
          "get",
          `/restpagos/pse/bancos.json?public_key=${apiKey}`,
          {},
          { sw: true, cashData: true },
        ),
    },
    cash: {
      create: (type, options) =>
        request("post", `/restpagos/v2/efectivo/${type}`, options, {
          sw: true,
          cashData: true,
        }),
      get: (uid) => txLookup(uid),
    },
    daviplata: {
      create: (options) =>
        request("post", "/payment/process/daviplata", options, {
          apify: true,
          card: true,
        }),
      confirm: (options) =>
        request("post", "/payment/confirm/daviplata", options, {
          apify: true,
          card: true,
        }),
    },
    safetypay: {
      create: (options) =>
        request("post", "/payment/process/safetypay", options, {
          apify: true,
          card: true,
        }),
    },
  };
}

function buildListUrl(path: string, options?: Payload): string {
  if (!options) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function parseResponse(res: Response): Promise<EpaycoResponse> {
  const text = await res.text();
  try {
    return JSON.parse(text) as EpaycoResponse;
  } catch {
    return { error: text || `HTTP ${res.status}` };
  }
}

/**
 * Best-effort server IP lookup (matches the SDK's ipify fallback). Used only
 * when the caller doesn't supply `ip`; bounded by a short timeout so the payment
 * hot path can't stall on a slow third party, and failures fall through silently.
 */
async function fetchServerIp(): Promise<string | undefined> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(IP_LOOKUP_TIMEOUT_MS),
    });
    const json = (await res.json()) as { ip?: string };
    return json.ip;
  } catch {
    return undefined;
  }
}

/**
 * Normalize ePayco's response into either the raw JSON or a thrown
 * `ConvexError`. ePayco never uses non-2xx for business errors — failures show
 * up as `{ error }` or `{ success: false }` — so we surface those as throws.
 */
export function unwrap(result: EpaycoResponse | null | undefined): EpaycoResponse {
  if (result == null) {
    throw new ConvexError({
      code: "EPAYCO_API_ERROR",
      message: "Empty response from ePayco",
    });
  }

  // The SDK-style `{ error }` envelope, or ePayco's bare `{ message }` envelope
  // (returned for account-gated features like recurring plans) — neither
  // carries a success flag, payload, or id, so treat them as failures.
  const hasNoSuccessSignal =
    result.success === undefined &&
    result.status === undefined &&
    result.data === undefined &&
    result.id === undefined &&
    (result as Record<string, unknown>).ref_payco === undefined &&
    (result as Record<string, unknown>).token === undefined;

  if (typeof result.error === "string" && hasNoSuccessSignal) {
    throw new ConvexError({
      code: "EPAYCO_API_ERROR",
      message: result.error,
      raw: result as unknown as Value,
    });
  }

  if (typeof result.message === "string" && hasNoSuccessSignal) {
    throw new ConvexError({
      code: "EPAYCO_API_ERROR",
      message: result.message,
      raw: result as unknown as Value,
    });
  }

  if (result.success === false || result.status === false) {
    const message =
      result.text_response ??
      result.textResponse ??
      result.title_response ??
      result.titleResponse ??
      result.message ??
      (typeof result.data === "object" && result.data !== null
        ? (result.data as Record<string, unknown>).description
        : undefined) ??
      "ePayco request failed";
    throw new ConvexError({
      code: "EPAYCO_API_ERROR",
      message: String(message),
      raw: result as unknown as Value,
    });
  }

  return result;
}

export function dataOf(result: EpaycoResponse): Record<string, unknown> {
  return typeof result.data === "object" && result.data !== null
    ? (result.data as Record<string, unknown>)
    : {};
}

export function pick(
  source: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return undefined;
}
