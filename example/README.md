# Tostado — `@pulgueta/epayco-convex` example

A small but complete storefront for a fictional Colombian specialty‑coffee
roaster, built to demonstrate the **ePayco Convex component** end to end. It's a
[TanStack Router](https://tanstack.com/router) SPA backed by Convex, with
[Convex Auth](https://labs.convex.dev/auth) (password) and a
[shadcn/ui](https://ui.shadcn.com) design system.

Every payment runs against the **real ePayco sandbox**.

## What it demonstrates

| Route | Feature | What's shown |
| --- | --- | --- |
| `/` · `/products/$slug` | Storefront | Reactive catalog, cart (client‑side), product detail |
| `/checkout` | **Card checkout** | Tokenize → create/reuse customer → charge, then follow the transaction live |
| `/split` | **Split payments** | One charge dispersed across a roaster, a grower co‑op and logistics |
| `/plans` | **Subscriptions** | Recurring "Coffee Club" plans, sign‑up and cancellation |
| `/order/$ref` | Confirmation | Reactive transaction status (and the split breakdown) |
| `/account` | Dashboard | Saved cards, active subscription, order history — all reactive |

## How the component is used

The wiring lives in `convex/`, and it's intentionally small:

- **`convex/convex.config.ts`** — `app.use(epayco)` installs the component.
- **`convex/epayco.ts`** — one `new EPayco(components.epayco, { testMode: true })`
  client, plus a `requireUser` helper. Credentials are read from the deployment
  environment by the component, never hard‑coded.
- **`convex/http.ts`** — `registerRoutes(http, components.epayco)` mounts the
  ePayco confirmation/response webhooks at `/epayco/*`.
- **`convex/payments.ts` / `subscriptions.ts`** — thin actions that call the
  `epayco.*` methods. Amounts are always recomputed server‑side from the cart
  (`convex/catalog.ts` → `priceItems`); the browser only ever sends product ids.
- **`convex/account.ts`** — reactive reads. Shows **both** ways the component
  exposes data: `exposeApi(...)` ready‑made auth‑gated queries, and a couple of
  hand‑written queries (`getMe`, `getLocalTokens`).

On the client, the component's React hooks are used directly:

- `usePayment(api.payments.payWithCard)` etc. for actions (in `checkout`,
  `split`, `plans`).
- `useTransaction(api.account.getTransaction, …)` for the reactive order page.

> The component also exposes **PSE, cash (Efecty/Baloto), Daviplata and
> SafetyPay**. This demo keeps checkout card‑only; see the component README for
> those rails.

## Running it

From the **repo root** (this example is a workspace package that consumes the
component via `workspace:*`):

```bash
pnpm install
pnpm dev          # builds the component, runs `convex dev`, and starts Vite
```

`pnpm dev` runs three things together: the component build watcher, `convex dev`
(functions live in `example/convex`), and the Vite dev server for this app.

### Environment

The Convex deployment needs these variables (set with `npx convex env set …`):

| Variable | Purpose |
| --- | --- |
| `EPAYCO_PUBLIC_KEY` / `EPAYCO_PRIVATE_KEY` | ePayco API credentials (sandbox) |
| `EPAYCO_P_CUST_ID_CLIENTE` / `EPAYCO_P_KEY` | Webhook signature verification |
| `EPAYCO_TEST_MODE=true` | Keep calls on the sandbox |
| `JWT_PRIVATE_KEY` / `JWKS` | Convex Auth keys (`npx @convex-dev/auth`) |

The app reads `VITE_CONVEX_URL` from `example/.env.local`.

Optional split receivers (default to the store's own client id):
`EPAYCO_SPLIT_PRIMARY_RECEIVER`, `EPAYCO_SPLIT_RECEIVER_ROASTER`,
`EPAYCO_SPLIT_RECEIVER_COOPERATIVE`, `EPAYCO_SPLIT_RECEIVER_LOGISTICS`.

### Sandbox test cards

The checkout form is pre‑filled with the approved card. To see a decline, use
the second one.

| Card | Result |
| --- | --- |
| `4575 6231 8229 0326` | Approved |
| `4151 6115 2758 3283` | Declined (insufficient funds) |

Any future expiry and any 3‑digit CVC.

## Project layout

```
convex/            ePayco wiring, auth, catalog, payments, subscriptions
src/
  routes/          file‑based routes (storefront, checkout, split, plans, account, order)
  components/      app shell, payment panel, product card, ui/ (shadcn)
  lib/             cart store, formatting, types, error helper
PRODUCT.md         strategic design context
DESIGN.md          visual system (tokens, type, motion)
```

Built with Convex, ePayco, TanStack Router, Tailwind v4 and shadcn/ui.
