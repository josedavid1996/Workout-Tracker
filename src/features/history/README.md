# history

Phase 9 (PR5). `/history` — chronological list of finished workouts
(`finished_at IS NOT NULL`), filterable by routine (or "Freestyle" / "Todas").

- `api/history.ts` — `fetchWorkoutHistory()`: finished workouts newest-first,
  each with its routine name (joined client-side by id — see the file's
  comment on why, not embedded in the same select), static duration
  (`workout-session/lib/format-duration.ts`, reused) and countable volume
  (`shared/lib/countable-set.ts#isCountable` + `shared/lib/volume.ts#sessionVolume`,
  PR2, both reused as-is). Unit tested against a mocked query-builder
  (`history.test.ts`).
- `api/use-history.ts` — thin React Query wiring (not unit-tested
  separately, same convention as other `use-*.ts` files).
- `pages/history-page.tsx` — the active (unfinished) workout, if any, is
  shown separately at the top (via `workout-session`'s
  `useActiveWorkoutQuery`) with a link into the live session; it is never
  mixed into the finished list. Routine filter chips ("Todas" / "Freestyle"
  / each routine), readable from a `?routineId=` query param for deep-linking
  from `features/routines/pages/routines-list-page.tsx`.

**Detail view decision**: finished workout items link straight to the
existing `/workout/:id/summary` (extended in this PR with a per-exercise/
sets breakdown) instead of a separate `/history/:workoutId` route — that
page was already the read-only view for a finished workout (no edit
affordances once `finished_at` is set), so a second route would only
duplicate it.
