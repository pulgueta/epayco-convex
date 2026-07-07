# Product

## Register

product

## Users

Developers evaluating the `@pulgueta/epayco-convex` component, plus anyone who
wants to see how ePayco's payment rails feel inside a real, reactive Convex +
TanStack Router app. The "customer" persona is a Colombian coffee buyer paying
in COP.

## Product Purpose

A reference storefront — **Tostado**, a fictional Colombian specialty-coffee
roaster — that demonstrates the three headline capabilities the component
exposes, each on its own route:

- **Checkout** — tokenize a card, create/reuse an ePayco customer, and charge,
  with the resulting transaction followed reactively to its final status.
- **Split payments** — a marketplace "Community Harvest" charge dispersed across
  a roaster, a grower cooperative, and a logistics partner.
- **Subscription plans** — a recurring "Coffee Club" with tiered plans, sign-up,
  and cancellation.

Success = a developer reads one route and understands exactly how to wire that
ePayco feature in their own app, with no ceremony.

## Brand Personality

Editorial, warm-but-precise, third-wave. Three words: **considered, generous,
local**. The copy is plain and confident; prices and money never hide.

## Anti-references

- The "coffee = kraft-brown + cream paper + hand-drawn beans" template. Warmth
  comes from the accent and typography, not a beige body.
- Generic SaaS-cream dashboards; identical icon-heading-text card grids.
- Demo apps that look like unstyled forms (the component deserves better).

## Design Principles

1. **The money is the hero.** Amounts, splits, and statuses are first-class,
   legible, and never approximated.
2. **Server owns the truth.** The browser sends product ids; prices, splits, and
   identity are computed server-side. The UI reflects that trust model.
3. **Reactive by default.** Payment status, saved cards, and subscriptions
   update live via Convex queries — no manual refresh, no polling.
4. **Earned familiarity.** Standard storefront affordances done well; surprise is
   reserved for the brand moments, not the checkout.
5. **Readable as a reference.** Every route maps to one component capability and
   reads cleanly for a future maintainer.

## Accessibility & Inclusion

Target WCAG 2.1 AA: body text ≥ 4.5:1, visible focus rings, keyboard-operable
flows, `prefers-reduced-motion` honored. Status is never conveyed by color
alone (icon + label + color).
