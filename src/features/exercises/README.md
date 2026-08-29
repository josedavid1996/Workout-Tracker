# exercises

Read-only catalog feature over the pre-existing `exercises` table (Phase 7,
PR4), plus the exercise detail/progress view (Phase 9, PR5).

- `api/exercises.ts` — `searchExercises(filters)`, `fetchRelatedExercises(muscleGroup, excludeId)`,
  `fetchExerciseById(id)` and `fetchExercisesByIds(ids)` (PR5 additions, backing
  the detail page title and a finished workout's per-exercise name display).
  Unit tested against a mocked query-builder (`exercises.test.ts`).
- `api/use-exercises.ts` / `api/use-exercise-history.ts` — thin React Query
  wiring (not unit-tested separately, same convention as other `use-*.ts`
  files).
- `api/exercise-history.ts` — `fetchExerciseSetHistory(exerciseId)`: every
  `set_entries` row for one exercise (any tag/completion — intentionally
  unfiltered, unlike the `countable_sets()` RPC), each joined with its
  owning workout's `created_at` (two-step client-side join — see the file's
  comment on why, not a single embedded select), sorted newest-first. Unit
  tested against a mocked query-builder (`exercise-history.test.ts`).
- `lib/to-chart-points.ts` — pure reshape of already-countable sets into
  chart-ready points (date/weight/reps/volume/1RM/lowConfidence), sorted
  oldest-first. Unit tested (`to-chart-points.test.ts`).
- `pages/exercise-detail-page.tsx` (`/exercises/:id`) — 3 tabs (`shared/ui/tabs.tsx`)
  over the SAME fetched history: **History** (raw log), **Chart**
  (Recharts, `Peso`/`Volumen`/`Reps` toggle, low-confidence points — reps > 12
  — marked with a distinct colored/larger dot instead of hidden), and
  **Records** (`shared/lib/records.ts`'s `bestOverall`/`bestByRepCount`/
  `projectedBest`, PR2, reused as-is). Chart and Records both filter the
  History tab's data through `isCountable` once — neither issues a second
  query.
