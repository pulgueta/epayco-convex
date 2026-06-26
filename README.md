# @pulgueta/epayco-convex

A [Convex](https://convex.dev) component for accepting payments with
[ePayco](https://epayco.co), Colombia's payment gateway — credit cards, **PSE**
bank transfers, **cash** vouchers (Efecty, Baloto, …), **Daviplata**, **SafetyPay**,
and recurring **plans/subscriptions**.

It gives you a typed, server-side client (`EPayco`), reactive payment tables that
sync automatically, webhook handling with signature verification, built-in rate
limiting, and ready-made React hooks — so you can wire a checkout in minutes and
keep the live payment state in your UI without polling.

```ts
// One call from any Convex action — the charge runs, the result is persisted,
// and every subscribed client re-renders the moment the status changes.
const charge = await epayco.chargeCreditCard(ctx, { userId, chargeInfo });
```

---

## Contents

- [What ePayco offers (and how this maps to the component)](#what-epayco-offers)
- [How it works](#how-it-works)
- [Install](#install)
- [Register the component](#register-the-component)
- [Environment variables](#environment-variables)
- [Quickstart — wire a card charge in 5 minutes](#quickstart)
- [Core concepts](#core-concepts)
- [Client-side wiring with React](#client-side-wiring-with-react)
- [Payment recipes](#payment-recipes)
  - [Credit cards](#credit-cards)
  - [PSE bank transfer](#pse-bank-transfer)
  - [Cash vouchers](#cash-vouchers)
  - [Daviplata](#daviplata)
  - [SafetyPay](#safetypay)
  - [Plans & subscriptions](#plans--subscriptions)
  - [Split payments (marketplaces)](#split-payments)
- [Webhooks & payment confirmation](#webhooks--payment-confirmation)
- [Reactive reads & `exposeApi`](#reactive-reads--exposeapi)
- [Security model](#security-model)
- [Integration patterns by app type](#integration-patterns-by-app-type)
- [Status vocabulary](#status-vocabulary)
- [Error handling](#error-handling)
- [API reference](#api-reference)
- [Database tables](#database-tables)
- [Rate limits](#rate-limits)
- [Sandbox & account-gated features](#sandbox--account-gated-features)
- [Testing](#testing)
- [License](#license)

---

## What ePayco offers

ePayco is a Colombian aggregator. Each payment method has its own flow; this
component exposes all of them behind one client:

| Method | What it is | Component method | Settlement |
| --- | --- | --- | --- |
| **Credit/debit card** | Tokenize a card, then charge it | `chargeCreditCard` | Instant (sync) |
| **PSE** | Online bank debit (redirect to the bank) | `createPseTransaction` | Async confirmation |
| **Cash** | Voucher paid at Efecty/Baloto/Gana/… | `createCashPayment` | Async confirmation |
| **Daviplata** | Wallet payment confirmed with an OTP | `createDaviplataPayment` + `confirmDaviplataPayment` | Two-step |
| **SafetyPay** | Cash or online-bank via SafetyPay | `createSafetyPayPayment` | Async confirmation |
| **Plans / subscriptions** | Recurring billing on a saved card | `createPlan` / `createSubscription` | Recurring |
| **Split payments** | Disperse one charge across receivers | `split` on charge/PSE/cash | Per method |

For the async methods, ePayco calls your **confirmation webhook** when the
payment settles; the component verifies the signature and updates the
transaction row, which your UI is already subscribed to.

---

## How it works

Convex components run only in the **V8 runtime**, so this component does **not**
depend on the Node-only [`epayco-sdk-node`](https://github.com/epayco/epayco-node)
package. Instead it reimplements ePayco's exact wire protocol natively using Web
platform APIs (`fetch`, Web Crypto) — JWT login, AES-128-CBC encryption for PSE,
the Spanish/camelCase field translation, and the apify Basic-auth flow — ported
field-for-field from the official SDK (`epayco-sdk-node@1.4.4`). The AES output
is verified **byte-identical** to the SDK's `crypto-js` implementation in the test
suite, so wire compatibility is locked in. The component runs fully inside Convex
with **no external runtime dependency**.

---

## Install

```bash
npm install @pulgueta/epayco-convex convex
# or: pnpm add @pulgueta/epayco-convex convex
```

`convex` (`^1.42`) and `react` (`^18.3 || ^19`, only if you use the hooks) are
peer dependencies.

---

## Register the component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import epayco from "@pulgueta/epayco-convex/convex.config.js";

const app = defineApp();
app.use(epayco);

export default app;
```

After this, run `npx convex dev` (or `codegen`) once so `components.epayco`
appears in your generated API.

---

## Environment variables

Set these on your Convex deployment (`npx convex env set …` or the dashboard):

| Variable | Required | Description |
| --- | --- | --- |
| `EPAYCO_PUBLIC_KEY` | Yes | ePayco `PUBLIC_KEY` (API public key) |
| `EPAYCO_PRIVATE_KEY` | Yes | ePayco `PRIVATE_KEY` (API private key) |
| `EPAYCO_P_CUST_ID_CLIENTE` | Webhooks | `P_CUST_ID_CLIENTE` — used to verify confirmation signatures |
| `EPAYCO_P_KEY` | Webhooks | `P_KEY` — used to verify confirmation signatures |
| `EPAYCO_TEST_MODE` | No | `"true"` to run against the ePayco sandbox |
| `EPAYCO_LANG` | No | `"ES"` (default) or `"EN"` |

These names map 1:1 to the fields in your ePayco dashboard. Credentials can also
be passed directly to the `EPayco` constructor (`publicKey`, `privateKey`,
`testMode`, `lang`), which takes precedence over the environment — handy for
multi-tenant setups where each tenant has its own keys.

> Secrets never reach the browser. The `EPayco` client reads them on the server
> and passes them to the component; your client code only ever calls your own
> Convex functions.

---

## Quickstart

A complete card charge — server action + reactive list + a button — in three
short files.

### 1. Create the client and an action

```ts
// convex/payments.ts
import { v } from "convex/values";
import { EPayco } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api";
import { action, query } from "./_generated/server";

// Construct once. Credentials come from EPAYCO_PUBLIC_KEY / EPAYCO_PRIVATE_KEY.
const epayco = new EPayco(components.epayco, { testMode: true });

export const charge = action({
  args: {
    tokenCard: v.string(),
    customerId: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx); // your auth — see Security model
    return await epayco.chargeCreditCard(ctx, {
      userId,
      chargeInfo: {
        tokenCard: args.tokenCard,
        customerId: args.customerId,
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        bill: "ORDER-1001",
        description: "Order #1001",
        value: args.value,
        tax: 0,
        taxBase: 0,
      },
    });
  },
});

// Reactive list — auto-updates when a webhook settles the payment.
export const myTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await epayco.listTransactions(ctx, { userId });
  },
});
```

### 2. Call it from React

```tsx
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function Checkout() {
  const charge = useAction(api.payments.charge);
  const txs = useQuery(api.payments.myTransactions) ?? [];

  return (
    <>
      <button
        onClick={() =>
          charge({ tokenCard: "tok_xxx", customerId: "cust_xxx", value: 50000 })
        }
      >
        Pay $50.000
      </button>

      <ul>
        {txs.map((t) => (
          <li key={t.epaycoRef}>
            {t.epaycoRef} — {t.status} — ${t.amount.toLocaleString()}
          </li>
        ))}
      </ul>
    </>
  );
}
```

That's the whole loop: the action charges and persists; the query is reactive,
so the list re-renders the instant the status changes (including later, when an
async confirmation arrives).

---

## Core concepts

**The `EPayco` class** is a thin, typed wrapper you construct once with the
component reference. Every method takes your Convex `ctx` plus typed args and
runs the relevant component action/query for you:

```ts
const epayco = new EPayco(components.epayco, {
  testMode: process.env.NODE_ENV !== "production",
});
```

**`userId` scoping.** Mutating/charging methods take a `userId` that *you*
resolve from your auth on the server — it's the owner the transaction, token,
customer, or subscription is filed under. Local read methods (`listTransactions`,
`getActiveSubscription`, …) filter by it. The client never supplies it directly
(see [Security model](#security-model)).

**Two kinds of reads.** "From ePayco" methods (`getCharge`, `getPlan`, …) hit the
ePayco API live and must run in an **action**. "Local" methods (`listTransactions`,
`getLocalTokens`, `listLocalBanks`, …) read the component's synced tables and run
in a **query**, so they're reactive and cheap.

**Errors are thrown, not returned.** ePayco signals business failures inside a
`200` body (`{ error }`, `{ success: false }`, or a bare `{ message }` for
account-gated features). The component normalizes all of these into a
`ConvexError` so your `try/catch` and the client both get a clean message — see
[Error handling](#error-handling).

---

## Client-side wiring with React

The component ships hooks from `@pulgueta/epayco-convex/react`. The most useful
is `usePayment`, which wraps any payment action with `isLoading` / `error` /
`result` state so you don't re-implement it per button:

```tsx
import { usePayment, useTransactions } from "@pulgueta/epayco-convex/react";
import { api } from "../convex/_generated/api";

function PayButton() {
  const { execute, isLoading, error, result } = usePayment(api.payments.charge);

  return (
    <div>
      <button
        disabled={isLoading}
        onClick={() =>
          execute({ tokenCard: "tok_xxx", customerId: "cust_xxx", value: 50000 })
        }
      >
        {isLoading ? "Processing…" : "Pay"}
      </button>
      {error && <p role="alert">{error.message}</p>}
      {result && <p>Ref: {result.data?.ref_payco}</p>}
    </div>
  );
}

function History() {
  // Pass any reactive query that returns transactions.
  const txs = useTransactions(api.payments.myTransactions, {}) ?? [];
  return <ul>{txs.map((t) => <li key={t.epaycoRef}>{t.status}</li>)}</ul>;
}
```

The query hooks (`useTransactions`, `useTransaction`, `useSubscriptions`,
`useActiveSubscription`, `useCustomer`) are typed pass-throughs over Convex's
`useQuery` — they exist so payment reads read clearly at the call site. You can
always use plain `useQuery` / `useAction` instead; nothing here is required.

---

## Payment recipes

Each recipe is a server action you expose + the matching client call. Input field
names below come straight from the component's validators.

### Credit cards

Card payments are three steps: **tokenize** the card → create a **customer** →
**charge** the token. Tokenization keeps raw card data out of your backend (the
component only ever stores the token, masked PAN, and franchise).

```ts
// convex/cards.ts
import { v } from "convex/values";
import { EPayco } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

const epayco = new EPayco(components.epayco, { testMode: true });

export const tokenize = action({
  args: { cardNumber: v.string(), expYear: v.string(), expMonth: v.string(), cvc: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.createToken(ctx, { userId, tokenInfo: args });
  },
});

export const createCustomer = action({
  args: { tokenCard: v.string(), name: v.string(), lastName: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    // ePayco requires last_name — always send it.
    return await epayco.createCustomer(ctx, { userId, customerInfo: args });
  },
});

export const charge = action({
  args: { tokenCard: v.string(), customerId: v.string(), value: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.chargeCreditCard(ctx, {
      userId,
      chargeInfo: {
        tokenCard: args.tokenCard,
        customerId: args.customerId,
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        bill: "INV-1001",
        description: "Order #1001",
        value: args.value, // in COP, e.g. 50000 = $50.000
        tax: 0,            // IVA included in `value`
        taxBase: 0,        // taxable base
        dues: 1,           // installments
      },
    });
  },
});
```

> **Saved-card charges.** Once a customer exists, you can charge their default
> card without a fresh token by passing `useDefaultCardCustomer: true` in
> `chargeInfo`. Manage cards with `epayco.addNewToken`, `epayco.addDefaultCard`,
> and `epayco.deleteCustomerCard`.

### PSE bank transfer

PSE needs the live list of banks first (cached locally), then a transaction that
returns a redirect URL you send the buyer to.

```ts
export const banks = query({
  args: {},
  handler: (ctx) => epayco.listLocalBanks(ctx), // reactive, from the synced table
});

export const refreshBanks = action({
  args: {},
  handler: (ctx) => epayco.getBanks(ctx), // fetch + cache from ePayco
});

export const payWithPse = action({
  args: { bank: v.string(), value: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const result = await epayco.createPseTransaction(ctx, {
      userId,
      pseInfo: {
        bank: args.bank,
        typePerson: "0", // "0" natural person, "1" company
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        cellPhone: "3001234567",
        bill: "INV-2001",
        description: "Order #2001",
        value: args.value,
        tax: 0,
        taxBase: 0,
        urlResponse: "https://your-app.com/pse/return",
      },
    });
    // result.data.urlbanco — redirect the buyer here.
    return result;
  },
});
```

When the buyer finishes at their bank, ePayco calls your confirmation webhook and
the transaction row flips to `approved`/`rejected` automatically.

### Cash vouchers

Generate a voucher/PIN the buyer pays at a physical point. `provider` picks the
network.

```ts
export const payWithCash = action({
  args: {
    provider: v.union(
      v.literal("efecty"), v.literal("baloto"), v.literal("gana"),
      v.literal("redservi"), v.literal("puntored"), v.literal("sured"),
    ),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.createCashPayment(ctx, {
      userId,
      provider: args.provider,
      cashInfo: {
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        cellPhone: "3001234567",
        bill: "INV-3001",
        description: "Order #3001",
        value: args.value,
        tax: 0,
        taxBase: 0,
        endDate: "2026-12-31", // voucher expiry (optional)
      },
    });
    // result.data.ref_payco + PIN/barcode → show to the buyer.
  },
});
```

### Daviplata

Two steps: start the payment (returns a `ref_payco` + `id_session_token`), then
confirm with the OTP the buyer receives. The session token is **redacted** from
the persisted transaction (it's a short-lived secret) but returned to your action
so you can pass it to the confirm step.

```ts
export const startDaviplata = action({
  args: { value: v.number(), phone: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.createDaviplataPayment(ctx, {
      userId,
      daviplataInfo: {
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: args.phone,
        description: "Order #4001",
        value: args.value,
        tax: 0,
        taxBase: 0,
      },
    });
    // → { data: { ref_payco, id_session_token } }
  },
});

export const confirmDaviplata = action({
  args: { refPayco: v.string(), idSessionToken: v.string(), otp: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await epayco.confirmDaviplataPayment(ctx, args);
  },
});
```

OTP confirmation is rate-limited per `ref_payco` to blunt brute-force guessing.

### SafetyPay

```ts
export const payWithSafetyPay = action({
  args: { value: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.createSafetyPayPayment(ctx, {
      userId,
      safetypayInfo: {
        cash: "1", // "1" cash, "2" online bank
        docType: "CC",
        docNumber: "1234567890",
        name: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "3001234567",
        description: "Order #5001",
        value: args.value,
        tax: 0,
        taxBase: 0,
      },
    });
  },
});
```

### Plans & subscriptions

Create a billing plan once, then subscribe a customer's saved card to it.

```ts
export const createPlan = action({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await epayco.createPlan(ctx, {
      planInfo: {
        idPlan: "pro-monthly",
        name: "Pro Monthly",
        description: "Pro plan billed monthly",
        amount: 49900,
        currency: "COP",
        interval: "month",
        intervalCount: 1,
        trialDays: 0,
      },
    });
  },
});

export const subscribe = action({
  args: { customer: v.string(), tokenCard: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.createSubscription(ctx, {
      userId,
      subscriptionInfo: {
        idPlan: "pro-monthly",
        customer: args.customer,   // ePayco customer id
        tokenCard: args.tokenCard,
        docType: "CC",
        docNumber: "1234567890",
      },
    });
  },
});

export const cancel = action({
  args: { epaycoSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    return await epayco.cancelSubscription(ctx, args);
  },
});

// Reactive: the current active subscription for the signed-in user.
export const activeSubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await epayco.getActiveSubscription(ctx, { userId });
  },
});
```

To bill a plan immediately (one-off recurring charge), use
`epayco.chargeSubscription(ctx, { userId, idPlan, customer, tokenCard, docType, docNumber })`
— it's rate-limited and the resulting charge is persisted to your transaction
history.

> Recurring billing is an **account-gated** ePayco feature. See
> [Sandbox & account-gated features](#sandbox--account-gated-features).

### Split payments

For marketplaces, disperse a single charge across receivers by adding `split` to
`chargeInfo` / `pseInfo` / `cashInfo`:

```ts
chargeInfo: {
  /* …normal fields… */
  split: {
    splitType: "02",
    splitReceivers: [
      { id: "1", total: "58000", iva: "8000", base_iva: "50000", fee: "10" },
    ],
  },
}
```

The receivers are also stored (in numeric form) on the transaction row as
`splitReceivers` for your records.

---

## Webhooks & payment confirmation

For every async method (PSE, cash, Daviplata, SafetyPay) ePayco calls your
**confirmation URL** when the payment settles. Register the routes on your HTTP
router:

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(http, components.epayco, {
  pathPrefix: "/epayco", // default
  // custIdCliente / pKey default to EPAYCO_P_CUST_ID_CLIENTE / EPAYCO_P_KEY
});

export default http;
```

This wires three routes:

| Route | Method | Purpose |
| --- | --- | --- |
| `/epayco/confirmation` | `POST` / `GET` | ePayco → your app. Verifies the SHA-256 signature, then updates the transaction. |
| `/epayco/response` | `GET` | The buyer's browser is redirected here. Returns a **minimal**, non-PII status payload. |

Point your ePayco dashboard's confirmation URL at:

```
https://YOUR_DEPLOYMENT.convex.site/epayco/confirmation
```

The handler is hardened:

- The signature is verified **before** anything is persisted, so an
  unauthenticated caller can't write arbitrary payloads into your tables.
- Events are stored idempotently (one row per `ref_payco`), so retries and races
  don't accumulate duplicates and an already-processed confirmation is a no-op.
- If a confirmation arrives **before** the local transaction exists, the event is
  left `pending` (with the verified payload stored) for reconciliation instead of
  being silently dropped.
- The public `/response` endpoint returns only `{ ref_payco, status, paymentMethod,
  amount, currency }` — never the customer email, raw response, or split details.

---

## Reactive reads & `exposeApi`

Two ways to read payment state in your client.

**Option A — your own query** (full control). Resolve the user from auth and call
the local read method:

```ts
export const myTransactions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    return await epayco.listTransactions(ctx, { userId, status: args.status });
  },
});
```

**Option B — `exposeApi`** (zero boilerplate). It generates a set of auth-gated
queries you re-export directly. You provide one `auth` callback that returns the
caller's id; the queries are **always scoped to that id** — there is no
client-supplied `userId`, so a signed-in user can never read another user's data.

```ts
// convex/payments.ts
import { exposeApi } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api";

export const {
  listTransactions,
  getTransaction,      // returns null unless the row belongs to the caller
  getCustomer,
  listSubscriptions,
  getActiveSubscription,
} = exposeApi(components.epayco, {
  auth: async (ctx, _operation) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return identity.subject; // this is the only scope these queries will use
  },
});
```

```tsx
// client
const txs = useQuery(api.payments.listTransactions, {}) ?? [];
const sub = useQuery(api.payments.getActiveSubscription, {});
```

---

## Security model

- **Secrets stay server-side.** API keys are read from the environment (or the
  constructor) and never sent to the browser. Clients only call your Convex
  functions.
- **Owner scoping is server-resolved.** You pass `userId` from your auth on the
  server. The `exposeApi` reactive queries take **no** client `userId` — scope is
  always the authenticated identity, and `getTransaction` returns `null` unless
  the row belongs to the caller. This closes object-level authorization holes.
- **Card data is never stored.** Tokenization keeps raw PANs out of your backend;
  only the token id, masked PAN, and franchise are persisted.
- **Confirmation webhooks are verified** with a constant-time SHA-256 check
  before any data is written, and processed idempotently.
- **Secrets are redacted** before persistence (e.g. the Daviplata
  `id_session_token`).
- **Rate limiting** is built in on every money-moving and abuse-prone path (see
  [Rate limits](#rate-limits)).

Always gate your payment actions behind your own auth. A minimal helper:

```ts
import type { Auth } from "convex/server";

async function requireUser(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity.subject;
}
```

---

## Integration patterns by app type

**SaaS (recurring revenue).** Create plans up front; on signup, tokenize the
card → create customer → `createSubscription`. Render `getActiveSubscription` in
your billing page and gate features on `subscription.status === "active"`. Use the
confirmation webhook to react to renewals/failures.

**E-commerce (one-time checkout).** Offer cards + PSE + cash. Cards settle
synchronously (`chargeCreditCard` returns the final status); PSE/cash return a
redirect URL or voucher and settle via webhook. Subscribe the order page to
`getTransaction(ref)` so it flips to "Paid" on its own.

**Marketplace (split settlement).** Use the `split` field on the charge/PSE/cash
call to disperse funds to sellers in the same transaction; the receivers are
stored on the transaction for reconciliation.

**Donations / POS / kiosks.** Cash vouchers (`createCashPayment`) and SafetyPay
let users pay offline; show the PIN/voucher and let the reactive transaction list
update when it's paid. Daviplata covers wallet users with an in-app OTP.

In every case the pattern is the same: **call one action, subscribe one query.**
The component keeps the synced tables current, your UI stays reactive, and
webhooks reconcile async settlement without polling.

---

## Status vocabulary

ePayco's numeric/textual states are normalized to one canonical set on every
transaction:

| Canonical | Meaning | ePayco source |
| --- | --- | --- |
| `pending` | Awaiting payment/confirmation | cod 3, 7; "pendiente" |
| `approved` | Paid | cod 1; "aceptada" |
| `rejected` | Declined / cancelled | cod 2, 11, 12; "rechazada", "cancelada" |
| `failed` | Failed / abandoned | cod 4, 10; "fallida", "abandonada" |
| `expired` | Voucher/timeout expired | cod 9; "expirada" |
| `reversed` | Refunded / reversed | cod 6; "reversada" |

---

## Error handling

Business failures surface as a `ConvexError` whose `data` is
`{ code: "EPAYCO_API_ERROR", message, raw }`. Extract the message on the client:

```ts
function errMsg(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: { message?: unknown } }).data;
    if (data && typeof data.message === "string") return data.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
```

```tsx
try {
  await charge({ /* … */ });
} catch (err) {
  setError(errMsg(err)); // e.g. "La tarjeta fue rechazada"
}
```

Rate-limit rejections also throw, so the same `try/catch` covers them.

---

## API reference

`new EPayco(components.epayco, options?)` — `options`: `publicKey`,
`privateKey`, `testMode`, `lang`.

### Payment methods (actions)

| Method | Description |
| --- | --- |
| `chargeCreditCard(ctx, { userId, chargeInfo })` | Charge a tokenized card |
| `getCharge(ctx, { epaycoRef })` | Look up a charge from ePayco |
| `createPseTransaction(ctx, { userId, pseInfo })` | Start a PSE debit |
| `getPseTransaction(ctx, { ticketId })` | PSE status from ePayco |
| `createCashPayment(ctx, { userId, provider, cashInfo })` | Cash voucher |
| `getCashPayment(ctx, { epaycoRef })` | Cash status from ePayco |
| `createDaviplataPayment(ctx, { userId, daviplataInfo })` | Start Daviplata |
| `confirmDaviplataPayment(ctx, { refPayco, idSessionToken, otp })` | Confirm with OTP |
| `createSafetyPayPayment(ctx, { userId, safetypayInfo })` | SafetyPay |

### Tokens & customers (actions)

| Method | Description |
| --- | --- |
| `createToken(ctx, { userId, tokenInfo })` | Tokenize a card |
| `createCustomer(ctx, { userId, customerInfo })` | Create an ePayco customer |
| `getCustomer(ctx, { epaycoCustomerId, userId })` | Customer from ePayco |
| `listCustomers(ctx, { page?, perPage? })` | List customers from ePayco |
| `updateCustomer(ctx, { userId, epaycoCustomerId, … })` | Update a customer |
| `addNewToken` / `addDefaultCard` / `deleteCustomerCard` | Manage saved cards |

### Plans & subscriptions (actions)

| Method | Description |
| --- | --- |
| `createPlan(ctx, { planInfo })` | Create a recurring plan |
| `getPlan` / `listPlans` / `updatePlan` / `deletePlan` | Manage plans |
| `createSubscription(ctx, { userId, subscriptionInfo })` | Subscribe a customer |
| `cancelSubscription(ctx, { epaycoSubscriptionId })` | Cancel |
| `chargeSubscription(ctx, { userId, idPlan, customer, tokenCard, docType, docNumber })` | One-off recurring charge |
| `getSubscription` / `listSubscriptionsFromEpayco` | Read from ePayco |

### Reactive local reads (queries)

| Method | Description |
| --- | --- |
| `listTransactions(ctx, { userId, status?, paymentMethod?, limit? })` | Synced transactions |
| `getTransaction(ctx, { epaycoRef })` | One transaction (local) |
| `getLocalTokens(ctx, { userId })` | Active saved tokens |
| `getLocalCustomer(ctx, { userId })` | Synced customer |
| `getActiveSubscription(ctx, { userId })` | Current active subscription |
| `listSubscriptions(ctx, { userId })` | Non-cancelled subscriptions |
| `listLocalPlans(ctx, { status? })` / `getLocalPlan` | Synced plans |
| `listLocalBanks(ctx)` | Cached PSE bank list |
| `getBanks(ctx)` *(action)* | Refresh + cache PSE banks from ePayco |

### Helpers

| Export | Description |
| --- | --- |
| `exposeApi(component, { auth })` | Auth-gated reactive queries (no client `userId`) |
| `registerRoutes(http, component, { pathPrefix?, custIdCliente?, pKey? })` | Webhook + response routes |
| `@pulgueta/epayco-convex/react` | `usePayment`, `useTransactions`, `useTransaction`, `useSubscriptions`, `useActiveSubscription`, `useCustomer` |

---

## Database tables

The component manages 7 isolated tables in its own namespace:

- `customers` — synced ePayco customers
- `tokens` — tokenized card references (never raw card data)
- `transactions` — all payments across every method
- `plans` — recurring billing plans
- `subscriptions` — customer↔plan associations
- `banks` — cached PSE bank list
- `webhookEvents` — confirmation audit trail with idempotency

---

## Rate limits

Built-in, via `@convex-dev/rate-limiter`:

| Operation | Limit | Key |
| --- | --- | --- |
| Customer / subscription creation | 5/min | `userId` |
| Token / card / PSE / cash / SafetyPay / Daviplata creation | 10/min | `userId` |
| Daviplata OTP confirmation | 5/min | `ref_payco` |
| Immediate subscription charge | 5/min | `userId` |
| Webhook processing | 200/min | `ref_payco` |

---

## Sandbox & account-gated features

- Set `EPAYCO_TEST_MODE=true` (or `testMode: true`) to use the ePayco sandbox.
- **Recurring billing** (`createPlan` / `createSubscription`) requires the
  recurring-payments feature to be enabled on your ePayco merchant account.
  Until then ePayco rejects the request, which the component surfaces as a
  `ConvexError` — not a silent success.
- The ePayco **PSE sandbox** is disabled server-side by ePayco, so
  `createPseTransaction` only completes in production.

These are ePayco-side gates, not component limitations; they surface cleanly as
errors so you can detect and message them.

---

## Testing

```bash
pnpm test
```

Tests use `convex-test` for isolated component testing, plus a crypto-parity
suite that pins the AES-128-CBC output byte-for-byte against the official SDK's
`crypto-js` vectors. See `src/component/*.test.ts`.

---

## License

Apache-2.0
