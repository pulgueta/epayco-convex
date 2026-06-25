# epayco-convex

A Convex component for integrating with [ePayco](https://epayco.co), Colombia's
payment processor. Supports credit cards, PSE bank transfers, cash payments
(Efecty, Baloto, etc.), Daviplata, and SafetyPay.

## Features

- Full ePayco REST API surface: customers, tokens, plans, subscriptions, and all
  payment methods
- Syncs payment state to isolated Convex tables with idempotent upserts
- Built-in rate limiting via `@convex-dev/rate-limiter`
- Webhook handling with SHA-256 signature validation
- Class-based client (`EPayco`) with environment variable support
- React hooks for querying payment data
- TypeScript-first with full type safety

## How it works

Convex components run only in the V8 runtime, so this component does **not**
depend on the Node-only [`epayco-sdk-node`](https://github.com/epayco/epayco-node)
package. Instead it reimplements ePayco's exact wire protocol natively using Web
platform APIs (`fetch`, Web Crypto) — JWT login, AES‑128‑CBC encryption for PSE,
Spanish/camelCase field translation, and the apify Basic‑auth flow — ported
field‑for‑field from the official SDK. The AES output is verified byte‑identical
to the SDK's `crypto-js` implementation in the test suite. The component runs
fully inside Convex with no external runtime dependency.

## Installation

```bash
npm install epayco-convex convex
```

Register the component in your `convex/convex.config.ts`:

```ts
import { defineApp } from "convex/server";
import epaycoConvex from "@pulgueta/epayco-convex/convex.config.js";

const app = defineApp();
app.use(epaycoConvex);

export default app;
```

## Environment Variables

Set these in your Convex dashboard or `.env.local`:

| Variable              | Required | Description                          |
| --------------------- | -------- | ------------------------------------ |
| `EPAYCO_PUBLIC_KEY`        | Yes      | ePayco `PUBLIC_KEY` (API public key)             |
| `EPAYCO_PRIVATE_KEY`       | Yes      | ePayco `PRIVATE_KEY` (API private key)           |
| `EPAYCO_P_CUST_ID_CLIENTE` | Webhooks | ePayco `P_CUST_ID_CLIENTE` for signature checks  |
| `EPAYCO_P_KEY`             | Webhooks | ePayco `P_KEY` for signature checks              |
| `EPAYCO_TEST_MODE`         | No       | `"true"` for sandbox mode                        |
| `EPAYCO_LANG`              | No       | `"ES"` (default) or `"EN"`                       |

These names map 1:1 to the fields shown in the ePayco dashboard. Credentials may
also be passed directly to the `EPayco` constructor (`publicKey`, `privateKey`,
`testMode`, `lang`), which takes precedence over the environment.

## Usage

### Using the EPayco class

```ts
// convex/example.ts
import { action, query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { EPayco } from "@pulgueta/epayco-convex";

const epayco = new EPayco(components.epaycoConvex, {
  testMode: true,
});

export const createCustomer = action({
  args: { tokenCard: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const userId = "user123";
    return await epayco.createCustomer(ctx, {
      userId,
      customerInfo: {
        tokenCard: args.tokenCard,
        name: args.name,
        email: args.email,
      },
    });
  },
});

export const chargeCreditCard = action({
  args: { /* charge fields */ },
  handler: async (ctx, args) => {
    return await epayco.chargeCreditCard(ctx, {
      userId: "user123",
      chargeInfo: args,
    });
  },
});

export const listTransactions = query({
  args: {},
  handler: async (ctx) => {
    return await epayco.listTransactions(ctx, { userId: "user123" });
  },
});
```

### Using exposeApi for direct client access

```ts
import { exposeApi } from "@pulgueta/epayco-convex";

export const { listTransactions, getTransaction, getCustomer } = exposeApi(
  components.epaycoConvex,
  {
    auth: async (ctx, operation) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");
      return identity.subject;
    },
  },
);
```

### Webhook setup

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@pulgueta/epayco-convex";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(http, components.epaycoConvex, {
  pathPrefix: "/epayco",
});

export default http;
```

Configure your ePayco dashboard to send confirmations to:
`https://YOUR_DEPLOYMENT.convex.site/epayco/confirmation`

### React hooks

```tsx
import {
  useTransactions,
  useActiveSubscription,
  usePayment,
} from "@pulgueta/epayco-convex/react";
import { api } from "../convex/_generated/api";

function PaymentDashboard() {
  const transactions = useTransactions(api.example.listTransactions, {});
  const subscription = useActiveSubscription(
    api.example.getActiveSubscription,
    {},
  );

  return (
    <div>
      <h2>Transactions: {transactions?.length ?? 0}</h2>
      <h2>
        Subscription: {subscription?.status ?? "none"}
      </h2>
    </div>
  );
}
```

## API Reference

### Payment Methods

| Method                              | Description                |
| ----------------------------------- | -------------------------- |
| `epayco.chargeCreditCard(ctx, args)`| Credit card charge         |
| `epayco.createPseTransaction(ctx, args)` | PSE bank transfer    |
| `epayco.createCashPayment(ctx, args)` | Cash (Efecty, Baloto, etc.) |
| `epayco.createDaviplataPayment(ctx, args)` | Daviplata payment |
| `epayco.confirmDaviplataPayment(ctx, args)` | Confirm with OTP |
| `epayco.createSafetyPayPayment(ctx, args)` | SafetyPay         |

### Customer & Token Management

| Method                              | Description                |
| ----------------------------------- | -------------------------- |
| `epayco.createCustomer(ctx, args)`  | Create ePayco customer     |
| `epayco.getCustomer(ctx, args)`     | Fetch from ePayco API      |
| `epayco.updateCustomer(ctx, args)`  | Update customer details    |
| `epayco.createToken(ctx, args)`     | Tokenize a card            |
| `epayco.getLocalCustomer(ctx, args)`| Read from local DB         |
| `epayco.getLocalTokens(ctx, args)`  | Read tokens from local DB  |

### Plans & Subscriptions

| Method                                  | Description             |
| --------------------------------------- | ----------------------- |
| `epayco.createPlan(ctx, args)`          | Create billing plan     |
| `epayco.createSubscription(ctx, args)`  | Subscribe customer      |
| `epayco.cancelSubscription(ctx, args)`  | Cancel subscription     |
| `epayco.chargeSubscription(ctx, args)`  | Immediate charge        |
| `epayco.getActiveSubscription(ctx, args)` | Current active sub   |

### Queries

| Method                                | Description                 |
| ------------------------------------- | --------------------------- |
| `epayco.getTransaction(ctx, args)`    | Get transaction by ref (local) |
| `epayco.listTransactions(ctx, args)`  | List with filters (local)   |
| `epayco.listSubscriptions(ctx, args)` | List non-cancelled subs (local) |
| `epayco.getBanks(ctx)`                | Fetch + cache PSE bank list |
| `epayco.listLocalBanks(ctx)`          | Read cached PSE banks       |

> Note: `createPlan`/`createSubscription` require the recurring-payments feature
> to be enabled on your ePayco merchant account; otherwise ePayco rejects the
> request (surfaced as a `ConvexError`). The ePayco PSE **sandbox** is also
> disabled server-side, so `createPseTransaction` only succeeds in production.

## Database Tables

The component manages 7 isolated tables:

- `customers` - Synced ePayco customers
- `tokens` - Tokenized card references (never raw card data)
- `transactions` - All payment transactions across all methods
- `plans` - Recurring billing plans
- `subscriptions` - Customer-plan associations
- `banks` - Cached PSE bank list
- `webhookEvents` - Webhook audit trail with idempotency

## Rate Limits

Built-in rate limiting prevents abuse:

- Customer/subscription creation: 5/min
- Charges/payments: 10/min
- Webhook processing: 200/min (fixed window)

## Testing

```bash
pnpm test
```

Tests use `convex-test` for isolated component testing. See
`src/component/*.test.ts` for examples.

## License

Apache-2.0
