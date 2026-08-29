# routines

- `api/routine-exercises-payload.ts` — pure: recomputes `position` from
  draft array order right before persisting.
- `api/routines.ts` — CRUD via `supabase-js`. `updateRoutine` replaces all
  `routine_exercises` rows on every save (delete + reinsert) rather than
  diffing; revisit if this becomes a perf/UX issue.
- `api/use-routines.ts` — React Query hooks wrapping the above.
- `lib/move-draft.ts` — pure array reorder helper for the in-form exercise
  list (up/down, no drag-and-drop in this PR).
- `pages/routines-list-page.tsx`, `pages/routine-form-page.tsx` (shared
  create/edit for `/routines/new` and `/routines/:id/edit`).

**TODO (phase 7 — exercise-catalog):** the "add exercise" step in
`routine-form-page.tsx` is a raw `exercise_id` text input. Replace it with a
real searchable/filterable exercise picker once exercise-catalog lands.
