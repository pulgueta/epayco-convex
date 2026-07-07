# Design

## Theme

**Tostado — botanical editorial.** A modern Colombian specialty-coffee roaster.
Airy near-white surface (never cream), a deep botanical green as the single
brand color doing the identity work, and a tightly-scoped ember-amber accent
reserved for prices, primary CTAs, and "roast" moments. Light by default with a
full dark theme (deep espresso-teal). Strategy: **Committed** — one saturated
green carries the brand on a neutral surface.

## Color (OKLCH)

Tokens live in `src/styles.css` as `:root` / `.dark` and are mapped to Tailwind
via `@theme inline`. Brand additions on top of the shadcn set: `--ember` /
`--ember-foreground`.

| Role | Light | Dark |
| --- | --- | --- |
| background | `0.99 0.003 190` (cool paper) | `0.185 0.014 190` (espresso) |
| foreground / ink | `0.23 0.018 190` | `0.95 0.006 180` |
| primary (pine green) | `0.44 0.08 184` | `0.72 0.10 182` |
| ember (amber accent) | `0.70 0.15 55` | `0.76 0.15 60` |
| muted-foreground | `0.43 0.02 195` | `0.72 0.01 185` |
| border | `0.91 0.005 195` | `1 0 0 / 10%` |

Contrast: body and muted text verified ≥ 4.5:1; primary-on-white ≥ 4.5:1 for
large text and links.

## Typography

Pair on a contrast axis: **serif display + grotesque sans**.

- **Display / headings:** Fraunces Variable (optical, soft) — `font-serif`.
  Used for the wordmark, hero, section titles, product names. Letter-spacing
  floor −0.02em; `text-wrap: balance` on h1–h3.
- **UI / body / data:** Geist Variable — `font-sans`. All controls, labels,
  prices, tables.

Both self-hosted via `@fontsource-variable/*` (no network fonts). Prose capped
at ~68ch.

## Components

shadcn (radix base, "radix-nova" style) in `src/components/ui/*`. Brand
composition lives in `src/components/*`. Every interactive element carries
default / hover / focus / disabled; loading uses skeletons, not spinners.
Product imagery is art-directed gradient panels + a lucide motif (no stock
photos, no hand-drawn SVG). Radius base 0.625rem — cards 12–16px, never
over-rounded.

## Motion

150–250ms, ease-out. Motion conveys state (status transitions, reveal of a
result, cart updates), never decoration. `prefers-reduced-motion` → crossfade or
instant. One tasteful staggered reveal on the storefront hero/grid; product
surfaces stay calm.

## Layout

Centered max-width content column (~1200px) with generous vertical rhythm. App
shell = top nav + cart; account area uses a calmer second neutral layer.
Responsive is structural (grid columns collapse, nav condenses), not fluid type.
