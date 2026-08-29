# Code Review Rules

## TypeScript
- Use `const`/`let`, never `var`.
- No `any` types; prefer precise types or `unknown` with narrowing.
- Strict TDD for non-trivial pure logic (see `src/shared/lib`, `src/features/*/lib`).

## React
- Functional components only, named exports.
- Reuse `src/shared/ui/*` primitives (Button, IconButton, DashedButton, Sheet, Chip, Tabs) instead of ad-hoc styled elements.
- Data access confined to each feature's `api/` folder; `shared/lib` stays dependency-free (pure functions).

## Supabase
- Never modify the pre-existing `exercises` table or its schema.
- RLS is the only authorization boundary (no server layer) — every new table needs a `user_id` + owner policy.
