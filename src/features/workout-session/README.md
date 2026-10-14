# workout-session

Starting, logging and finishing a workout. No timers anywhere (deliberate):
duration is a static value on the summary page.

- `api/workout-session.ts` — `startWorkout(routineId | null)` creates the
  workout, copies the routine's exercises and pre-fills their set rows (one
  per `target_sets`, planned reps, last time's weight per set). Also
  `addWorkoutExercise`, `removeWorkoutExercise`, `replaceWorkoutExercise`,
  `logSet`/`updateSet`/`toggleCompleted`/`deleteSet`, `finishWorkout`,
  `discardWorkout` (unfinished workouts only) and `getPreviousSessionSets`
  (what was done last time, via the `countable_sets` RPC). Unit tested against
  a mocked query-builder (`workout-session.test.ts`).
- `api/use-workout-session.ts` — thin React Query wiring.
- `lib/prefill-sets.ts` — rules for the pre-filled rows and for picking the
  previous session's sets.
- `lib/session-sets.ts` — client-side set order (completed first, by
  completion time) and the "weight not filled in yet" rule (a pending 0 kg).
- `lib/exercise-swap.ts` — swap plan: in place when nothing was completed,
  otherwise the original is kept and the replacement goes right after it.
- `pages/workout-start-page.tsx` (`/workout/start`) — freestyle or pick a
  routine. The home card starts today's routine directly, skipping this page.
- `pages/workout-session-page.tsx` (`/workout/:id`) — every exercise in one
  list. The usual gesture is "Completar set" on a pre-filled row. A set's
  number opens its menu (tag, un-complete, delete); "⋯" opens the exercise's
  (swap, skip, remove). The close button offers discarding the workout. The
  screen stays on via `shared/lib/use-wake-lock.ts`. Component-tested
  (`workout-session-page.test.tsx`).
- `pages/workout-summary-page.tsx` (`/workout/:id/summary`) — totals, new
  PRs and per-exercise breakdown; also the read-only detail from `/history`.
