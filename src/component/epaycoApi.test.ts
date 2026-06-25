/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { aesEncrypt, pick, dataOf } from "./epaycoClient.js";
import { buildSplitPayload, storedReceivers } from "./payloads.js";
import { statusFromCodResponse, statusFromEstado } from "./status.js";

// Reference ciphertexts produced by Node's `aes-128-cbc` (PKCS#7, zero IV) for
// the sandbox PRIVATE_KEY. CryptoJS in the official SDK produces identical
// output, so matching these proves wire-format parity with epayco-sdk-node.
const PRIVATE_KEY = "d04fa6c07b1d74f035252cbcc252d06f";

describe("aesEncrypt (AES-128-CBC, zero IV, PKCS#7 — parity with epayco-sdk-node)", () => {
  test("matches reference vectors", async () => {
    expect(await aesEncrypt("TRUE", PRIVATE_KEY)).toBe("gOY6w0CdQyIW8JuOufEHbQ==");
    expect(await aesEncrypt("10000", PRIVATE_KEY)).toBe("k7mBU8C9DugxtIbTHGNnlA==");
    expect(await aesEncrypt("hello", PRIVATE_KEY)).toBe("XAbuNWlv/m9Nz/Xd6HVivg==");
  });

  test("is deterministic for the zero IV", async () => {
    const a = await aesEncrypt("repeatable", PRIVATE_KEY);
    const b = await aesEncrypt("repeatable", PRIVATE_KEY);
    expect(a).toBe(b);
  });
});

describe("status mapping", () => {
  test("statusFromCodResponse", () => {
    expect(statusFromCodResponse("1")).toBe("approved");
    expect(statusFromCodResponse(2)).toBe("rejected");
    expect(statusFromCodResponse("3")).toBe("pending");
    expect(statusFromCodResponse("4")).toBe("failed");
    expect(statusFromCodResponse("6")).toBe("reversed");
    expect(statusFromCodResponse("9")).toBe("expired");
    expect(statusFromCodResponse("11")).toBe("rejected");
    expect(statusFromCodResponse("999")).toBe("pending");
  });

  test("statusFromEstado", () => {
    expect(statusFromEstado("Aceptada")).toBe("approved");
    expect(statusFromEstado("RECHAZADA")).toBe("rejected");
    expect(statusFromEstado("Pendiente")).toBe("pending");
    expect(statusFromEstado("Fallida")).toBe("failed");
    expect(statusFromEstado("reversada")).toBe("reversed");
    expect(statusFromEstado(undefined)).toBe("pending");
  });
});

describe("split payment payloads", () => {
  test("returns empty object when no split", () => {
    expect(buildSplitPayload(undefined, false)).toEqual({});
  });

  test("charge: receivers as raw array", () => {
    const out = buildSplitPayload(
      {
        splitType: "02",
        splitReceivers: [
          { id: "1", total: "58000", iva: "8000", base_iva: "50000", fee: "10" },
        ],
      },
      false,
    );
    expect(out.splitpayment).toBe("true");
    expect(out.split_type).toBe("02");
    expect(Array.isArray(out.split_receivers)).toBe(true);
  });

  test("PSE/cash: receivers JSON-stringified", () => {
    const out = buildSplitPayload(
      {
        splitReceivers: [
          { id: "1", total: "58000", iva: "8000", base_iva: "50000" },
        ],
      },
      true,
    );
    expect(typeof out.split_receivers).toBe("string");
    expect(JSON.parse(out.split_receivers as string)).toHaveLength(1);
  });

  test("storedReceivers converts strings to numbers", () => {
    const stored = storedReceivers({
      splitReceivers: [
        { id: "1", total: "58000", iva: "8000", base_iva: "50000", fee: "10" },
      ],
    });
    expect(stored).toEqual([
      { id: "1", total: 58000, iva: 8000, base_iva: 50000, fee: 10 },
    ]);
  });
});

describe("response helpers", () => {
  test("dataOf extracts nested data", () => {
    expect(dataOf({ data: { ref_payco: "abc" } })).toEqual({ ref_payco: "abc" });
    expect(dataOf({})).toEqual({});
  });

  test("pick returns first non-empty candidate as string", () => {
    expect(pick({ a: "", b: 42 }, ["a", "b"])).toBe("42");
    expect(pick({ ref_payco: "R1" }, ["refPayco", "ref_payco"])).toBe("R1");
    expect(pick({}, ["x"])).toBeUndefined();
  });
});
