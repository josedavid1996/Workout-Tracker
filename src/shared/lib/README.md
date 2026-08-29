# shared/lib

Pure, framework-agnostic domain logic and utilities — no I/O, no Supabase, no feature imports. Each module is co-located with its Vitest tests.

- `one-rm.ts` — Brzycki estimated 1RM.
- `countable-set.ts` — `CountableSet` type + `isCountable`, the single client-side implementation of the completed/non-warmup filter (mirrors `countable_sets()` in `supabase/migrations/0004_functions.sql`).
- `volume.ts` — session volume over already-filtered sets.
- `records.ts` — best-overall / best-by-rep-count / projected-best, built on `one-rm.ts`.
- `plates.ts` — plate calculator (`planPlates`) and warm-up ramp (`warmupRamp`).

See `tasks.md` phase 3 for the full breakdown and future feature UIs in phase 4+.
