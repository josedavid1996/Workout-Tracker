# shared/ui

Presentational UI primitives styled with Tailwind against the design tokens
defined in `src/index.css` (`@theme`): dark background, brass/gold accent,
Barlow Condensed for display/uppercase text, Inter for body, JetBrains Mono
for numeric data.

- `button.tsx` — `primary` / `secondary` / `ghost` variants, `sm` / `md` sizes.
- `input.tsx` — labeled text input with an optional error message.
- `sheet.tsx` — mobile bottom sheet (backdrop + Escape dismiss).
- `tabs.tsx` — minimal controlled tab bar (parent owns `value`/`onChange`).

No unit tests for these — pure rendering, no non-trivial logic. See
`src/shared/lib/cx.ts` (+ test) for the classnames helper they share.
