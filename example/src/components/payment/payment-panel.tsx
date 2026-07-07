import { useQuery } from "convex/react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "@cvx/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Me, SavedCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Billing = {
  name: string;
  lastName: string;
  email: string;
  docType: string;
  docNumber: string;
};

export type PaymentPayload = {
  savedTokenId?: string;
  cardToken?: { tokenId: string; mask: string; franchise: string };
  billing: Billing;
};

const DOC_TYPES = [
  { value: "CC", label: "CC — Cédula de ciudadanía" },
  { value: "CE", label: "CE — Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PP", label: "Passport" },
  { value: "TI", label: "TI — Tarjeta de identidad" },
];

// ePayco sandbox: this Visa test card is approved in test mode. The declined
// equivalent is 4151 6115 2758 3283 (insufficient funds).
const TEST_CARD = {
  cardNumber: "4575 6231 8229 0326",
  expMonth: "12",
  expYear: "2030",
  cvc: "123",
};

type EPaycoGlobal = {
  setPublicKey: (publicKey: string) => void;
  token: {
    create: (
      form: HTMLFormElement,
      callback: (error: unknown, token: unknown) => void,
    ) => void;
  };
};

declare global {
  interface Window {
    ePayco?: EPaycoGlobal;
    jQuery?: unknown;
    $?: unknown;
  }
}

let epaycoScriptPromise: Promise<void> | null = null;
let jqueryScriptPromise: Promise<void> | null = null;

function loadScript(src: string, errorMessage: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`,
  );
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(errorMessage)),
        {
          once: true,
        },
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(errorMessage));
    document.head.append(script);
  });
}

function loadJqueryScript() {
  if (window.jQuery && window.$) return Promise.resolve();
  jqueryScriptPromise ??= loadScript(
    "https://code.jquery.com/jquery-3.7.1.min.js",
    "jQuery failed to load.",
  );
  return jqueryScriptPromise;
}

async function loadEpaycoScript() {
  await loadJqueryScript();
  if (window.ePayco) return;
  epaycoScriptPromise ??= loadScript(
    "https://checkout.epayco.co/epayco.min.js",
    "ePayco.js failed to load.",
  );
  return epaycoScriptPromise;
}

function tokenFromResponse(token: unknown) {
  if (typeof token === "string") return token;
  if (!token || typeof token !== "object") return null;
  const data = token as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};
  const value =
    data.epaycoToken ??
    data.token ??
    data.id ??
    nested.epaycoToken ??
    nested.token ??
    nested.id;
  return value ? String(value) : null;
}

function epaycoErrorMessage(error: unknown) {
  if (!error || typeof error !== "object")
    return "Could not tokenize that card.";
  const data = error as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : {};
  return String(
    nested.description ??
      nested.message ??
      data.description ??
      data.message ??
      "Could not tokenize that card.",
  );
}

function detectFranchise(cardNumber: string) {
  if (cardNumber.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) {
    return "mastercard";
  }
  if (/^3[47]/.test(cardNumber)) return "amex";
  return "card";
}

async function tokenizeCard({
  publicKey,
  card,
  billing,
}: {
  publicKey: string;
  card: typeof TEST_CARD;
  billing: Billing;
}) {
  await loadEpaycoScript();
  if (!window.ePayco) throw new Error("ePayco.js is not available.");

  window.ePayco.setPublicKey(publicKey);

  const form = document.createElement("form");
  form.hidden = true;
  const fields: Record<string, string> = {
    "card[name]": `${billing.name} ${billing.lastName}`.trim(),
    "card[email]": billing.email,
    "card[number]": card.cardNumber,
    "card[cvc]": card.cvc,
    "card[exp_month]": card.expMonth,
    "card[exp_year]": card.expYear,
  };
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.dataset.epayco = key;
    input.value = value;
    form.append(input);
  }
  document.body.append(form);

  try {
    const tokenId = await new Promise<string>((resolve, reject) => {
      window.ePayco!.token.create(form, (error, token) => {
        if (error) {
          reject(new Error(epaycoErrorMessage(error)));
          return;
        }
        const id = tokenFromResponse(token);
        if (!id) {
          reject(new Error("ePayco did not return a card token."));
          return;
        }
        resolve(id);
      });
    });
    const last4 = card.cardNumber.slice(-4);
    return {
      tokenId,
      mask: `****${last4}`,
      franchise: detectFranchise(card.cardNumber),
    };
  } finally {
    form.remove();
  }
}

export function PaymentPanel({
  submitLabel,
  pending,
  error,
  onPay,
}: {
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onPay: (payload: PaymentPayload) => void | Promise<void>;
}) {
  const savedCards = useQuery(api.account.getLocalTokens) as
    | SavedCard[]
    | undefined;
  const me = useQuery(api.account.getMe) as Me | undefined;
  const publicConfig = useQuery(api.payments.getPublicConfig) as
    | { publicKey: string; testMode: boolean }
    | undefined;
  const savedCardsLoading = savedCards === undefined;
  const hasSaved = !!savedCards && savedCards.length > 0;

  const [method, setMethod] = useState<"saved" | "new" | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [card, setCard] = useState(TEST_CARD);
  const [billing, setBilling] = useState<Billing>({
    name: "Camila",
    lastName: "Restrepo",
    email: "",
    docType: "CC",
    docNumber: "1032456789",
  });
  const [emailTouched, setEmailTouched] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const busy = pending || submitting;
  const resolvedMethod =
    method ?? (savedCardsLoading ? null : hasSaved ? "saved" : "new");
  const resolvedTokenId = selectedTokenId ?? savedCards?.[0]?._id ?? null;
  const email = !emailTouched && me?.email ? me.email : billing.email;

  function setBillingField(field: keyof Billing, value: string) {
    setBilling((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setLocalError(null);

    const finalBilling: Billing = { ...billing, email };
    if (
      !finalBilling.name ||
      !finalBilling.lastName ||
      !finalBilling.email ||
      !finalBilling.docNumber
    ) {
      setLocalError("Fill in your billing details.");
      return;
    }

    if (resolvedMethod === "saved") {
      if (!resolvedTokenId) {
        setLocalError("Choose a saved card.");
        return;
      }
      setSubmitting(true);
      try {
        await onPay({ savedTokenId: resolvedTokenId, billing: finalBilling });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (resolvedMethod !== "new") {
      setLocalError("Payment methods are still loading.");
      return;
    }

    const cardNumber = card.cardNumber.replace(/\s+/g, "");
    if (
      cardNumber.length < 12 ||
      !card.expMonth ||
      !card.expYear ||
      !card.cvc
    ) {
      setLocalError("Enter complete card details.");
      return;
    }
    if (!publicConfig?.publicKey) {
      setLocalError("ePayco public key is not configured.");
      return;
    }

    setSubmitting(true);
    try {
      const cardToken = await tokenizeCard({
        publicKey: publicConfig.publicKey,
        card: { ...card, cardNumber },
        billing: finalBilling,
      });
      await onPay({ cardToken, billing: finalBilling });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const shownError = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Payment method</h3>

        {savedCardsLoading ? (
          <p className="rounded-lg border border-input bg-card p-3 text-sm text-muted-foreground">
            Loading saved cards…
          </p>
        ) : hasSaved ? (
          <RadioGroup
            value={resolvedMethod === "saved" ? (resolvedTokenId ?? "") : "new"}
            onValueChange={(value) => {
              if (value === "new") {
                setMethod("new");
              } else {
                setMethod("saved");
                setSelectedTokenId(value);
              }
            }}
            className="gap-2"
          >
            {savedCards!.map((savedCard) => (
              <label
                key={savedCard._id}
                htmlFor={`card-${savedCard._id}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-card p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5",
                )}
              >
                <RadioGroupItem
                  id={`card-${savedCard._id}`}
                  value={savedCard._id}
                />
                <CreditCard className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">{savedCard.mask}</span>
                <span className="ml-auto text-xs text-muted-foreground uppercase">
                  {savedCard.franchise}
                </span>
              </label>
            ))}
            <label
              htmlFor="card-new"
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border border-input bg-card p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5",
              )}
            >
              <RadioGroupItem id="card-new" value="new" />
              <span className="text-sm font-medium">Use a new card</span>
            </label>
          </RadioGroup>
        ) : null}

        {resolvedMethod === "new" ? (
          <div className="grid gap-3 rounded-lg border border-input bg-card p-4">
            <div className="grid gap-2">
              <Label htmlFor="cardNumber">Card number</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.cardNumber}
                onChange={(e) =>
                  setCard((c) => ({ ...c, cardNumber: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="expMonth">Month</Label>
                <Input
                  id="expMonth"
                  placeholder="MM"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  value={card.expMonth}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, expMonth: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expYear">Year</Label>
                <Input
                  id="expYear"
                  placeholder="YYYY"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  value={card.expYear}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, expYear: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvc}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, cvc: e.target.value }))
                  }
                />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Sandbox test card pre-filled — browser tokenized by ePayco before
              the server receives the payment request.
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Billing details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">First name</Label>
            <Input
              id="name"
              autoComplete="given-name"
              value={billing.name}
              onChange={(e) => setBillingField("name", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              value={billing.lastName}
              onChange={(e) => setBillingField("lastName", e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billingEmail">Notification email</Label>
          <Input
            id="billingEmail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmailTouched(true);
              setBillingField("email", e.target.value);
            }}
          />
          <p className="text-xs text-muted-foreground">
            ePayco sends purchase, approval, denial, and other payment
            notifications to this address. It can differ from the signed-in
            account email.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="docType">Document type</Label>
            <Select
              value={billing.docType}
              onValueChange={(value) => setBillingField("docType", value)}
            >
              <SelectTrigger id="docType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((doc) => (
                  <SelectItem key={doc.value} value={doc.value}>
                    {doc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="docNumber">Document number</Label>
            <Input
              id="docNumber"
              inputMode="numeric"
              value={billing.docNumber}
              onChange={(e) => setBillingField("docNumber", e.target.value)}
            />
          </div>
        </div>
      </section>

      {shownError ? (
        <p role="alert" className="text-sm text-destructive" aria-live="polite">
          {shownError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy || savedCardsLoading}
        aria-busy={busy}
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {busy ? "Processing…" : submitLabel}
      </Button>
    </form>
  );
}
