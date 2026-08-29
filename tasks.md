# Workout Tracker — Tasks

Source of truth for the full 62-item / 14-phase plan is the approved SDD
`tasks` artifact (`sdd/workout-tracker/tasks`). This file mirrors and tracks
completion for **PR1** (Phase 1: Setup, Phase 2: Schema & RLS), **PR2**
(Phase 3: pure domain logic + unit tests), **PR3** (Phase 4: shared UI,
Phase 5: auth-session, Phase 6: routine-management), **PR4** (Phase 7:
exercise-catalog, Phase 8: workout-session + set-tagging + plate-calculator),
**PR5** (Phase 9: progress-history, Phase 10: user-equipment), and **PR6**
(Phase 11: RLS integration tests, Phase 12: E2E) — see below. **PR7** and
**PR8** (Phase 13, Phase 14) were added afterwards, ad hoc (not part of the
original 62-item plan), to rebuild every screen's presentation against the
real Figma design — **PR8: rediseño visual completo, las 9 pantallas ya
matchean Figma real.**

**Project complete.** PR6 is the last PR in the plan and the only one that
runs against the real Supabase instance instead of mocks — see
`supabase/tests/README.md` (`npm run test:rls`) and `e2e/README.md`
(`npm run e2e`) for how to run those against real infra, and the root
`README.md`'s "Tests against the real instance" section for the full
picture. `npm run test` (128 tests, all mocked, no network) is unaffected
and keeps passing on its own.

**Verified against the real instance** (`http://192.168.101.5:8000`, real
`.env`, `mailer_autoconfirm: true`):
- `npm run test:rls` — **9/9 passed**, no code changes needed.
- `npm run e2e` — **1/1 passed**, after fixing 2 real locator bugs found
  only by actually running it against the live app (not assumed/guessed):
  `shared/ui/tabs.tsx` renders each tab with an explicit `role="tab"`
  (overriding the implicit `role="button"` of the underlying `<button>`),
  so the login/signup mode toggle and the exercise-detail page's
  History/Chart/Records toggle both needed `getByRole('tab', ...)`, not
  `getByRole('button', ...)`; separately, `getByRole('button', { name:
  'Agregar' })` non-exact-matched both "Agregar" and "Agregar ejercicio",
  needing `exact: true`. Both are documented inline in
  `e2e/full-flow.spec.ts`.
- `npm run test` / `npm run build` / `npm run lint` re-run after — still
  128/128, clean build, clean lint.

Migrations 0001–0004 are applied to `http://192.168.101.5:8000` (confirmed
working via the REST API: 6 tables + the `countable_sets` function). GoTrue
(Auth) is confirmed running on the same instance.

## Phase 1: Setup

- [x] 1.1 Scaffold Vite + React + TypeScript. Add Tailwind CSS, react-router-dom, Recharts, @tanstack/react-query, @supabase/supabase-js.
- [x] 1.2 `src/shared/supabase/client.ts`: Supabase client reading `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env (no hardcoded keys; `env.example` template committed, real `.env` gitignored).
- [x] 1.3 Skeletons: `src/app/router.tsx`, `src/app/providers.tsx`, `src/app/query-client.ts`, `src/app/protected-route.tsx` (placeholders — real pages land in future PRs).
- [x] 1.4 Vitest + Playwright scripts configured in `package.json` / `vite.config.ts` / `playwright.config.ts` (no tests written yet — PR2/PR6).

## Phase 2: Schema & RLS

- [x] 2.1 `supabase/migrations/0001_core_schema.sql` — `set_tag` enum + tables: `routines`, `routine_exercises`, `workouts`, `workout_exercises`, `set_entries`, `user_equipment`. Does not modify the pre-existing `exercises` table.
- [x] 2.2 `supabase/migrations/0002_indexes.sql` — supporting indexes, including the single-active-workout unique index and the progress lookup index.
- [x] 2.3 `supabase/migrations/0003_rls.sql` — RLS enabled + `auth.uid() = user_id` owner policy on all 6 new tables.
- [x] 2.4 `supabase/migrations/0004_functions.sql` — `countable_sets(p_exercise_id text)`, `security invoker`, the single implementation of the completed/non-warmup filter.
- [x] 2.5 Documented `database.types.ts` generation (`supabase gen types typescript`) in `src/shared/supabase/README.md` and `supabase/migrations/README.md`. Not generated in this PR — migrations have not been applied against the real instance.

## Phase 3: Pure Domain Logic & Unit Tests (PR2)

All functions live in `src/shared/lib/`, are pure (no I/O, no Supabase, no
feature imports), and have co-located Vitest tests written before the
implementation (Strict TDD: RED → GREEN per function).

- [x] 3.1 `one-rm.ts` — `estimateOneRm(weight, reps)` using the Brzycki formula (`weight * 36 / (37 - reps)`); `lowConfidence` when `reps > 12`; `null` when `reps >= 37`.
- [x] 3.2 `one-rm.test.ts` — low-rep exact values, `lowConfidence` boundary at 12/13, `null` at 37/50, `weight=0` does not throw.
- [x] 3.3 `countable-set.ts` — `CountableSet` type + `isCountable(set)` (`completed && tag !== 'warmup'`), the single client-side implementation matching `countable_sets()` in `0004_functions.sql`.
- [x] 3.4 `countable-set.test.ts` — warmup excluded, normal/drop/failure included when completed, anything excluded when not completed.
- [x] 3.5 `volume.ts` — `sessionVolume(sets: CountableSet[])` summing `weight * reps` over already-filtered sets (does not re-filter).
- [x] 3.6 `volume.test.ts` — multi-set sum, empty array, single set.
- [x] 3.7 `records.ts` — `bestOverall` (highest estimated 1RM via `estimateOneRm`), `bestByRepCount` (heaviest weight per exact rep count), `projectedBest` (inverse Brzycki projection with inherited `lowConfidence`).
- [x] 3.8 `records.test.ts` — empty-array safety, best-by-1RM vs. raw volume, per-rep-count map, projection value + `lowConfidence` boundary.
- [x] 3.9 `plates.ts` — `planPlates` greedy per-side plate calculator (`null` with no inventory, `perSide: []` at/below bar weight, best-effort approximation when inventory is insufficient) and `warmupRamp` (inventory-independent ramp from bar to target).
- [x] 3.10 `plates.test.ts` — exact fill, insufficient-inventory approximation, no-inventory `null`, at/below-bar-weight, ramp values, custom step count, ramp works without inventory.

## Phase 4: Shared UI (PR3)

- [x] 4.1 `src/shared/ui/{button,input,sheet,tabs}.tsx` — Tailwind primitives against the design tokens in `src/index.css` (`@theme`: dark background, brass/gold accent, Barlow Condensed / Inter / JetBrains Mono via Google Fonts `@import`). Pure rendering, no dedicated unit tests (see `src/shared/lib/cx.ts` + test for the one pure helper they share).

## Phase 5: auth-session (PR3)

- [x] 5.1 `features/auth/api/auth.ts` — `signUp` / `signIn` / `signOut` wrapping `supabase.auth`; maps Supabase errors to a plain `error: string`. Unit tested with a mocked Supabase client (`auth.test.ts`).
- [x] 5.2 `features/auth/pages/login-page.tsx` — one form, login/signup toggle via `Tabs`; readable error messages; "revisá tu email" message after signup (`mailer_autoconfirm` is off). Component-tested (`login-page.test.tsx`).
- [x] 5.3 `src/app/protected-route.tsx` — uses `useSession()` (`onAuthStateChange` + `getSession()`, one shared subscription) to redirect to `/login` when there is no session. `features/auth/api/use-session.ts` (`SessionProvider` + `useSession`) is the reusable hook/context, unit tested (`use-session.test.tsx`).
- [x] 5.4 `src/app/router.tsx` wired: `/login` public; `/`, `/routines`, `/routines/new`, `/routines/:id/edit` all wrapped in `ProtectedRoute`.

## Phase 6: routine-management (PR3)

- [x] 6.1 `features/routines/api/` — CRUD via `supabase-js` (`routines.ts`, unit tested against a mocked query-builder chain) + React Query hooks (`use-routines.ts`). `routine-exercises-payload.ts` is the pure position-recomputation logic, unit tested standalone.
- [x] 6.2 Pages: `pages/routines-list-page.tsx` (`/routines`), `pages/routine-form-page.tsx` (shared create/edit for `/routines/new` and `/routines/:id/edit`, using `useParams`).
  - **TODO (phase 7 — exercise-catalog):** the "add exercise" step in `routine-form-page.tsx` (inside the `Sheet`) is a raw `exercise_id` text input — explicitly marked with a `TODO(phase 7 - exercise-catalog)` comment in the source. Replace with a real searchable/filterable exercise picker once exercise-catalog lands; not implemented here.
- [x] 6.3 Reordering: `lib/move-draft.ts` (pure up/down array swap, unit tested) drives the in-form exercise list; `position` is recomputed from array order via `routine-exercises-payload.ts` at save time.

## Phase 7: exercise-catalog (PR4)

- [x] 7.1 `features/exercises/api/exercises.ts` — read-only queries over the pre-existing `exercises` table: `searchExercises({ name, category, bodyPart, equipment })` (all optional/combinable, `name` via `ilike`), `fetchRelatedExercises(muscleGroup, excludeId)` (`muscle_group` match, excludes the current exercise, capped to 6). Unit tested against a mocked query-builder chain (`exercises.test.ts`). `features/exercises/api/use-exercises.ts` is the thin React Query wiring (not unit-tested separately, same convention as `use-routines.ts`).
- [x] 7.2 `features/workout-session/components/exercise-picker/exercise-picker.tsx` — reusable search/filter overlay (`Sheet`-based): debounced (`shared/lib/use-debounced-value.ts`, unit tested with fake timers) search input, category/body-part/equipment filter chips (`exercise-filter-options.ts`), a "Relacionados" section shown only when opened with a `relatedTo` context, and a results list. Component-tested (`exercise-picker.test.tsx`) mocking the `use-exercises` hooks. Consumed by both `routine-form-page.tsx` and the workout-session pages (Phase 8) — one implementation, not duplicated.
- [x] 7.3 `routine-form-page.tsx`'s "add exercise" step now opens the real `ExercisePicker`; picking an exercise opens a small `Sheet` to enter target sets/reps before confirming. Replaces the raw `exercise_id` text input and its `TODO(phase 7 - exercise-catalog)` comment. Known limitation: the in-form exercise list still displays `exercise_id` (not the exercise name) for already-added rows, since `fetchRoutine`/`toDraft` do not carry a name — out of scope for this PR.

## Phase 8: workout-session + set-tagging + plate-calculator (PR4)

- [x] 8.1 `features/workout-session/api/workout-session.ts` — `startWorkout(routineId | null)` (pre-populates `workout_exercises` in routine order when `routineId` is given), `resumeActiveWorkout()` (the at-most-one `finished_at IS NULL` row), `fetchWorkout(id)` (full detail incl. `workout_exercises.set_entries`), `fetchRoutineTargets(routineId)` (target hint, matched by `position`), `addWorkoutExercise`, `logSet`/`updateSet`/`toggleCompleted`, `finishWorkout`, `getLastLoggedWeight` (calls the `countable_sets` RPC, then excludes the current workout and picks the most recent client-side — the RPC's signature only takes `p_exercise_id`), and `getUserEquipment` (degrades to `null` via `.maybeSingle()` plus a defensive error catch, for when no `user_equipment` row exists yet). All unit tested against a mocked query-builder + RPC (`workout-session.test.ts`, 16 cases). `use-workout-session.ts` is the thin React Query wiring (not unit-tested separately).
- [x] 8.2 Pages: `workout-start-page.tsx` (`/workout/start`, pick a routine or freestyle; redirects into an already-active workout instead of allowing a second one), `workout-session-page.tsx` (`/workout/:id`, resumable; no live timers; planned-vs-logged per exercise; "Terminar" button). Decision: adding an exercise mid-session (`ExercisePicker`) is offered only for freestyle workouts (`routine_id === null`) with zero sets logged so far across the whole workout — once any set exists, or the workout came from a routine, the exercise list is frozen. "Saltar" is UI-only local state (no schema column) — it just visually collapses an exercise and hides its "add set" action; it never persists and never substitutes the exercise.
- [x] 8.3 `components/set-row/set-row.tsx` — weight(kg)/reps controlled inputs + completed checkbox, built on `shared/ui/input`. Pure rendering, no dedicated unit test (same convention as `shared/ui/{button,input}`).
- [x] 8.4 `components/tag-overlay/tag-overlay.tsx` — small fixed-option `Sheet` (normal/warmup/drop/failure). No dedicated unit test (same convention as `shared/ui/tabs.tsx`). **Schema note**: `0001_core_schema.sql`'s original `set_entries.reps` check (`reps > 0`) predates the "failure allows reps=0" requirement and blocks it for every tag. Added `supabase/migrations/0005_failure_reps_zero.sql` (`reps > 0 or tag = 'failure'`) to fix this — **not applied** to the real instance from this environment (no service-role credentials here, same constraint PR1's migrations note documents). Until 0005 is applied, logging a `failure` set with `reps = 0` will be rejected by the DB. `workout-session-page.tsx`'s "add set" defaults to `reps = 1` (not `0`) precisely to avoid tripping the pre-0005 constraint for the common `normal`-tag case.
- [x] 8.5 `components/plate-calculator/plate-calculator.tsx` — reuses `shared/lib/plates.ts` (`planPlates`/`warmupRamp`, PR2) + `getUserEquipment()`; when no `user_equipment` row exists (phase 10 / PR5 not built yet), degrades to "ramp only, no plate breakdown" exactly as `planPlates` already does for empty/missing inventory.
- [x] 8.6 `workout-summary-page.tsx` (`/workout/:id/summary`) — static duration via `format-duration.ts` (`finished_at - created_at`, unit tested), volume via `shared/lib/volume.ts#sessionVolume` over sets mapped through `isCountable` + `to-countable-set.ts` (unit tested), and a completed-sets count (all tags, not just countable).
- [x] 8.7 Wired in `src/app/router.tsx`: `/workout/start`, `/workout/:id`, `/workout/:id/summary`, all under `ProtectedRoute`. Added minimal links from the home placeholder.

## Phase 9: progress-history (PR5)

- [x] 9.1 `features/history/api/history.ts` — `fetchWorkoutHistory()`: finished
  workouts (`finished_at IS NOT NULL`) newest-first, each with routine name
  (joined client-side by id), static duration
  (`workout-session/lib/format-duration.ts`, reused) and countable volume
  (`shared/lib/countable-set.ts#isCountable` + `shared/lib/volume.ts#sessionVolume`,
  PR2, reused as-is). Unit tested against a mocked query-builder
  (`history.test.ts`). `pages/history-page.tsx` (`/history`) lists them,
  filterable by routine chips ("Todas" / "Freestyle" / each routine, the
  last also readable from a `?routineId=` query param) and shows the
  active (unfinished) workout, if any, separately at the top with a link
  into the live session.
- [x] 9.2 **Decision**: reused `/workout/:id/summary` as the read-only
  workout detail (no separate `/history/:workoutId` route) — that page
  already has no edit affordances once `finished_at` is set. Extended it in
  this PR with the per-exercise/sets breakdown it was missing (exercise
  names resolved via the new `fetchExercisesByIds`, each linking to
  `/exercises/:id`), which is what the reuse needed.
- [x] 9.3 `features/exercises/pages/exercise-detail-page.tsx` (`/exercises/:id`)
  — 3 tabs (`shared/ui/tabs.tsx`) over the SAME fetched set history
  (`api/exercise-history.ts#fetchExerciseSetHistory`, unit tested,
  two-step client-side join against `workouts` for each set's date —
  documented inline why, not a single embedded select): **History** (every
  set, any tag/completion state), **Chart** (Recharts, Peso/Volumen/Reps
  toggle via `lib/to-chart-points.ts`, unit tested; low-confidence points —
  reps > 12 — rendered with a distinct colored/larger dot instead of
  hidden), and **Records** (`shared/lib/records.ts`'s `bestOverall`/
  `bestByRepCount`/`projectedBest`, PR2, reused as-is, over the exact same
  countable-filtered sets as the other two tabs — no separate query).

## Phase 10: user-equipment (PR5)

- [x] 10.1 `features/equipment/api/equipment.ts` — `getUserEquipment()`
  (canonical implementation; `features/workout-session/api/workout-session.ts`
  now re-exports it instead of duplicating it, so `use-workout-session.ts`
  and `plate-calculator.tsx` — PR4 — did not need to change) and
  `saveUserEquipment(barWeight, plateInventory)` (upsert keyed on `user_id`,
  the table's PK). Unit tested against a mocked query-builder
  (`equipment.test.ts`), including a light mocked integration test
  confirming `getUserEquipment()`'s result correctly feeds
  `shared/lib/plates.ts#planPlates` (PR2) — no real instance needed.
  `pages/equipment-settings-page.tsx` (`/settings/equipment`) is the form:
  bar weight (default 20kg) + an editable plate list (weight/count rows,
  add/remove). `shared/lib/plates.ts`'s `planPlates`/`warmupRamp` and
  `plate-calculator.tsx` (both PR2/PR4) were **not** touched — they already
  handle "no inventory" vs. "real inventory"; saving here just makes a real
  `user_equipment` row exist so the plate calculator finds it.

## Phase 11: RLS Integration Tests (PR6)

- [x] 11.1 `supabase/tests/setup.ts` (`createTestUser`, real
  `signUp()`/`signInWithPassword()` fallback + `runCleanup`) +
  `supabase/tests/rls.rls.test.ts` — 2 real users, 2 authenticated
  supabase-js clients. Isolation covered for `routines`, `workouts`,
  `set_entries`, plus `routine_exercises`, `workout_exercises`, and
  `user_equipment`: user B can never `select`/`update`/`delete` a row
  owned by user A.
- [x] 11.2 `countable_sets` RPC RLS test: user B calling the function with
  user A's `exercise_id` never sees A's rows.
- [x] 11.3 Composite-FK forged-`user_id` test: documents that this fails
  as a **foreign key violation (`23503`)**, not an RLS denial — inserting
  with the caller's own `user_id` (passes the simple `auth.uid() =
  user_id` check) but a `routine_id` belonging to a different user (fails
  the composite `(routine_id, user_id)` FK).
- [x] 11.4 Single-active-workout test: a second `finished_at IS NULL`
  insert for the same user fails with a **unique violation (`23505`)**
  (`workouts_single_active_idx`).
- [x] 11.5 Cleanup in `afterAll` via each owning user's client (RLS-safe,
  no service-role key). Documented limitation: the 2 test auth users
  themselves cannot be deleted without the admin API/a service-role key —
  see `supabase/tests/README.md`.
- Kept out of `npm run test` (`vite.config.ts` excludes
  `supabase/tests/**`); runs via its own `npm run test:rls` +
  `vitest.rls.config.ts`.

## Phase 12: E2E (PR6)

- [x] 12.1 `e2e/full-flow.spec.ts` — signup → login (this instance's login
  page never auto-navigates after signup, so the test logs in explicitly
  right after) → create a routine with 1 real exercise (looked up from
  `exercises`, never hardcoded) → start a workout from it → log 1 set →
  reload (asserts the session is *resumed*, not fresh) → finish → summary
  (duration/volume) → `/exercises/:id` → History/Chart/Records. Documented
  in `e2e/README.md` (`npm run e2e`, requires a real `.env`).

## Phase 13: Visual rebuild — Home, Routines, Routine form, Exercise picker (PR7)

Presentation-only rebuild of 4 screens against the REAL Figma layouts
(`design/figma-reference/`), replacing the generic PR3-PR5 layout that only
ever applied a text-brief color palette (which itself was later replaced —
see `src/index.css`'s real Figma tokens: bg `#0f172a`, accent `#2563eb`,
Poppins/Roboto/JetBrains Mono). No business logic changed: routine
create/edit/reorder (`move-draft.ts`, `routine-exercises-payload.ts`),
exercise search/filter, and workout-session logic are all untouched.

- [x] 13.1 **Home (`/`)** — `src/features/home/pages/home-page.tsx` (new;
  the old `HomePlaceholder` inline in `router.tsx` is gone). Real data via
  existing hooks only: greeting name/avatar initials derived from the
  session email's local-part (no display-name field exists at signup);
  "hoy toca" = most recently used routine (from the most recent finished
  workout that has one) or the most recently created routine as fallback,
  empty state when the user has no routines at all; 3 stat tiles
  (Sesiones/Volumen/PRs) backed by a NEW `fetchHomeStats()` in
  `features/history/api/history.ts` (shares its query with
  `fetchWorkoutHistory` via an extracted `fetchFinishedWorkoutRows()`
  helper — same rows, aggregated differently) — see
  `features/history/lib/home-stats.ts` for the documented "PRs" heuristic
  (an exercise counts as a PR when its all-time-best estimated-1RM set,
  via the SAME `shared/lib/records.ts#bestOverall` used by the
  exercise-detail Records tab, was logged in the most recent workout);
  streak is a REAL computed value (`features/history/lib/streak.ts#computeStreakDays`
  — consecutive days with a finished workout, broken if the gap since the
  last one is more than 1 day), not a placeholder 0, per the explicit
  request to avoid fabricating a number when a real calculation was
  feasible; recent activity reuses `features/history/api/history.ts`
  as-is.
- [x] 13.2 **Lista de rutinas (`/routines`)** — `routines-list-page.tsx`
  rewritten against real routine data via a NEW `fetchRoutinesWithExercises()`
  in `features/routines/api/routines.ts` (all of the user's routines with
  nested `routine_exercises`, one query) + the existing
  `useExercisesByIdsQuery` (workout-summary precedent) to resolve real
  exercise names/`body_part` for the filter tabs and chips. Filter tabs are
  derived from each routine's `dominantBodyPart` (mode of its exercises'
  `body_part`, `features/routines/lib/routine-summary.ts`) — never
  hardcoded Push/Pull/Legs. "Hace Nd"/"Nunca" badge via
  `shared/lib/days-since.ts`; only the single globally most-recently-used
  routine gets the green badge, matching the Figma note. Delete
  functionality (existing, PR3) preserved as a small icon button per card
  (not shown in the Figma mock, which has no delete affordance — kept so
  the feature isn't lost).
- [x] 13.3 **Crear/editar rutina (`/routines/new`, `/routines/:id/edit`)** —
  `routine-form-page.tsx` restyled (header back+Guardar, large uppercase
  name input with focus state, error banner + "Reintentar guardado" on a
  failed save, dashed "Agregar ejercicio" button, drag-handle icon per row).
  Also fixes the PR4-documented known limitation: exercise rows now show
  the real exercise NAME (via `useExercisesByIdsQuery`) instead of the raw
  `exercise_id`, which also enabled deriving the "muscle groups touched"
  chips for free. Reordering still uses the existing tested `moveDraft`
  up/down logic (no real drag-and-drop — explicitly out of scope per the
  Figma doc's own implementation note).
- [x] 13.4 **Selector de ejercicio (`exercise-picker.tsx`, shared overlay)**
  — restyled with body-part chips, and a NEW equipment→6-category mapping:
  `features/exercises/lib/equipment-category.ts` (`equipmentToCategory`,
  `equipmentCategoryLabel`, `rawEquipmentValuesForCategory`), unit tested
  (`equipment-category.test.ts`, TDD). The mapping is built from the REAL
  distinct `exercises.equipment` values, queried live against the Supabase
  instance (not guessed): `dumbbell`, `body weight`, `cable`, `barbell`,
  `leverage machine`, `band`, `kettlebell`, `ez barbell`, `stability ball`,
  `assisted`, `rope`, `sled machine`, `upper body ergometer`,
  `medicine ball` → `freeweight` / `machine` / `cable` / `bodyweight` /
  `cardio` / `accessory` (debatable calls documented inline: `assisted` →
  `machine`, not `bodyweight`; `upper body ergometer` is the only raw value
  mapping to `cardio` in this catalog). `searchExercises`'s `equipment`
  filter now also accepts `string[]` (`.in(...)`) alongside the existing
  single-value `.eq(...)`, additive/backward-compatible. **Deviation from
  the Figma mock**: selection stays single-pick-and-close (`onSelect`
  fires once, Sheet closes), not the mock's multi-select + footer
  "Agregar N ejercicios" — both real consumers
  (`routine-form-page.tsx`, `workout-session-page.tsx`) already depend on
  the single-pick contract and changing it would be a business-logic
  change, out of scope for a presentation-only PR. The pre-existing
  "Categoría" filter chip row (not present in the Figma mock, which only
  shows PARTE DEL CUERPO + EQUIPO) was kept because removing it would have
  broken existing tested behavior (`exercise-picker.test.tsx`).
- [x] 13.5 New shared UI primitives extracted for patterns the Figma design
  repeats across screens: `shared/ui/chip.tsx` (filter/category pill, used
  by the routines-list tabs, the routine-form muscle-group tags, and all 3
  exercise-picker chip rows), `shared/ui/stat-tile.tsx` (Home's 3-tile
  stat row), `shared/ui/bottom-nav.tsx` (Home + Routines' fixed bottom nav
  — "Perfil" has no route yet in this app, rendered as a dimmed
  non-interactive item with a `TODO(future PR)` instead of a dead link).
  `features/routines/components/routine-list-card.tsx` is the routine-card
  sub-component used by `/routines`.
- New pure logic, all Strict-TDD (RED → GREEN, tests written first):
  `shared/lib/days-since.ts`, `features/exercises/lib/equipment-category.ts`,
  `features/history/lib/streak.ts`, `features/history/lib/home-stats.ts`,
  `features/routines/lib/routine-summary.ts` (`estimateWorkoutMinutes`,
  `dominantBodyPart`).
- `npm run test` — **177/177 passed** (128 existing + 49 new, none broken).
  `npm run build` and `npm run lint` — clean.

## Phase 14: Visual rebuild — Iniciar workout, Sesión activa, Resumen, Historial, Detalle de ejercicio (PR8)

Presentation-only rebuild of the remaining 5 screens against the REAL Figma
layouts (`design/figma-reference/05` through `09`), completing the full
9-screen visual rebuild started in PR7. No previously-tested business logic
was changed: `records.ts`, `volume.ts`, `one-rm.ts`, `plates.ts`, and
`features/workout-session/api/workout-session.ts` are all untouched — every
new pure function below is additive and lives in its own module, reusing
those via import only.

- [x] 14.1 **Iniciar workout (`/workout/start`)** — `workout-start-page.tsx`
  rebuilt: featured Freestyle card with the concentric-circles decorative
  motif (confirmed real, not brass-exclusive — see `05-iniciar-workout.md`)
  and a compact chevron-list of saved routines (own component, not
  `RoutineListCard` — that card's badge/delete/history-link chrome doesn't
  match this simpler chevron-navigation pattern, a deliberate deviation).
  Dashed empty state with "Crear rutina" CTA when the user has no routines.
- [x] 14.2 **Sesión activa (`/workout/:id`)** — `workout-session-page.tsx`
  rewritten to one-exercise-at-a-time (progress bar `N/total` + prev/next
  nav) instead of a stacked list of every exercise, matching
  `06-sesion-activa.md`. Sets table with SET/ANTERIOR/KG/REPS columns and
  per-row states (completed=green+check, current=blue-bordered+editable,
  future=dimmed dashes, error=red+warning). A passive "SET REGISTRADO"
  confirmation overlay appears after completing a set (manual "Continuar"
  dismiss — **NO timer**, per the already-decided no-live-timers rule).
  Network-failure handling (new vs. PR4): per-set mutation `onError`
  callbacks (existing `useToggleCompletedMutation`/`useUpdateSetMutation`,
  unchanged) mark that set's row red with a "Reintentar" action — no change
  to the mutation hooks themselves, only how the page reacts to their
  existing error state. **Deviation**: "ANTERIOR" shows the same
  `getLastLoggedWeight()` value (weight only) for every row instead of a
  per-set-index historical value — the schema/API only ever exposes one
  "last logged weight" per exercise, not a per-set-position history, so a
  richer per-row value isn't available without a new query shape (out of
  scope for a presentation-only PR).
- [x] 14.3 **Resumen post-workout (`/workout/:id/summary`)** —
  `workout-summary-page.tsx` rebuilt: gradient header with a green
  check-circle + "WORKOUT COMPLETADO", 2x2 stat-tile grid (Ejercicios/
  Volumen/Sets/PRs nuevos), "Nuevo PR" banner, per-exercise breakdown list,
  footer share (best-effort `navigator.share`, no dedicated UI feedback,
  placeholder per the doc's own note) + "Guardar workout" (returns to `/`,
  since `finishWorkout` already ran on the session page before navigating
  here). **Decision on "Duración"**: the real Figma 2x2 grid has no explicit
  duration tile. Rather than drop the existing, tested `formatDuration`
  value, it is shown as a small subtitle next to the date in the header
  (`LUN 6 JUL · 42 min`) instead of forcing a 5th grid cell the design
  doesn't have — documented inline in the page. "Nuevo PR" detection is a
  NEW pure fn, `features/workout-session/lib/new-prs.ts#detectNewPrs`
  (TDD), comparing this session's best set per exercise (by estimated 1RM,
  reusing `records.ts#bestOverall` + `one-rm.ts` as-is) against every OTHER
  session's best for that exercise, fetched via the existing
  `fetchExerciseSetHistory` (exercise-detail feature, PR5) fanned out per
  exercise with `useQueries` — no new Supabase query shape.
- [x] 14.4 **Historial general (`/history`)** — `history-page.tsx` rebuilt
  with a GitHub-style monthly activity heatmap: NEW pure, unit-tested
  `features/history/lib/heatmap.ts#computeMonthHeatmap` (TDD), a simple
  7-column CSS grid (no charting library), intensity level derived from
  **sessions-per-day count** (0/1/2/3+ → level 0-3) since the schema has no
  per-day volume/load rollup to weight cells by instead — documented as the
  simplest honest signal, not a forced full-effort heatmap. A "esta semana"
  3-column session list (day/name+sets/volume) replaces the old flat list
  for the current week; the pre-existing routine-filter chips are kept
  (not shown in the Figma variants seen) but relocated below the main
  content instead of removed. `WorkoutHistoryItem` gained an additive
  `setsCount` field (`features/history/api/history.ts`, existing test
  extended, not broken) to back the week-list's "N SETS" label.
- [x] 14.5 **Detalle de ejercicio (`/exercises/:id`)** —
  `exercise-detail-page.tsx` rewritten from 3 tabs (History/Chart/Records,
  PR5) to ONE scrollable view per `09-detalle-ejercicio.md` and the
  explicit user decision recorded for this PR: stats (PR·kg / 1RM est. / a
  NEW "+N kg · 8sem" delta tile) → Recharts line chart (Peso/Volumen/Reps
  toggle via the shared `Chip`, "Peso" now plots the **estimated 1RM**
  rather than raw weight, per the design doc) → "Registro" session list
  with a PR badge on the record-setting day. `shared/ui/tabs.tsx` itself is
  untouched (`login-page.tsx` still uses it) — only this page stopped using
  it. The chart is built with real Recharts (line + dots, low-confidence
  points rendered larger/lighter) — the Figma chart image was reference
  only, not literal pixels, per the doc's own note. The 8-week delta is a
  NEW pure, unit-tested fn,
  `features/exercises/lib/eight-week-delta.ts#computeEightWeekDelta` (TDD),
  comparing the best estimated 1RM from sets 8+ weeks ago vs. more recent
  sets (both via `records.ts#bestOverall` + `one-rm.ts`, reused as-is).
  Loading/empty/error states added (previously only a bare "Cargando...").
- [x] 14.6 NEW shared UI: `shared/ui/skeleton.tsx` (simple pulsing
  placeholder), reused by the summary/history/exercise-detail loading
  states instead of ad hoc `animate-pulse` divs per page.
- New pure logic, all Strict-TDD (RED → GREEN, tests written first):
  `features/history/lib/heatmap.ts`, `features/exercises/lib/eight-week-delta.ts`,
  `features/workout-session/lib/new-prs.ts`.
- `e2e/full-flow.spec.ts` updated to match the new markup (routine-card is
  now one tappable button, not a separate "Empezar" button; "Terminar" moved
  to the session header; summary assertions target the new stat-tile
  labels; exercise-detail assertions target "Registro" instead of the
  removed History/Chart/Records tabs). **Not re-run against the real
  instance in this session** (no live Supabase credentials/network access
  in this environment) — unlike PR6/PR7, this update has NOT been verified
  end-to-end yet; run `npm run e2e` before merging to confirm.
- `npm run test` — **192/192 passed** (177 existing + 15 new, none broken).
  `npm run build` and `npm run lint` — clean.

## PR9: fixes de UI (botones/overflow/nav/flujo)

See plan in `~/.claude/plans/velvety-purring-music.md` (section "PR9 — Fixes
de UI y flujo") for full context — this was found by the user after running
the app locally post-PR8. Presentation/navigation-only, no backend/business
logic touched.

- **Botones**: `shared/ui/button.tsx` gained a `text` variant (no
  bg/border/padding of its own — callers own their typography) for
  header-style actions: "Guardar" (`routine-form-page.tsx`) and "Terminar"
  (`workout-session-page.tsx`). New shared `shared/ui/dashed-button.tsx`
  (`DashedButton`, structural-only: dashed border + disabled state, callers
  own typography) replaces the duplicated "Agregar ejercicio"/"Agregar set"
  markup. New shared `shared/ui/icon-button.tsx` (`IconButton`, always
  `rounded-full`, `sm`/`md` sizes) replaces the 4 circular icon buttons that
  previously had inconsistent radii: "Volver" (`routine-form-page.tsx`),
  "Buscar" (`routines-list-page.tsx`), "Mes anterior" (`history-page.tsx`),
  "Compartir" (`workout-summary-page.tsx`). `exercise-detail-page.tsx`'s
  "Reintentar" now uses `<Button variant="secondary">` directly instead of
  duplicating its styles. Deleted
  `features/workout-session/components/set-row/set-row.tsx` — confirmed dead
  code (grepped, zero importers) before removal.
- **Overflow**: `workout-session-page.tsx`'s header routine-name span gets
  `flex-1 min-w-0 truncate`; `workout-start-page.tsx`'s routine-name span
  (inside its `min-w-0` flex wrapper) gets `truncate`.
- **Bottom nav**: added `<BottomNav/>` (+ `pb-28` on the page container) to
  `routine-form-page.tsx`, `workout-start-page.tsx`, `workout-summary-page.tsx`,
  `exercise-detail-page.tsx`, `equipment-settings-page.tsx` — matching the
  pattern already used by `home-page.tsx`/`routines-list-page.tsx`/
  `history-page.tsx`. Left out of `/login` and `/workout/:id` (focus-mode
  decision, already taken). Every page container using `min-h-screen` was
  switched to `min-h-dvh` (Safari iOS visual-viewport fix), including
  `login-page.tsx` and `workout-session-page.tsx` which don't get the nav.
  **Deviation from the plan**: `routine-form-page.tsx` already had its own
  page-level fixed bottom action bar (the "Guardar rutina" CTA + error
  banner). Adding a second `fixed inset-x-0 bottom-0` element
  (`<BottomNav/>`) would have silently overlapped/hidden it — the plan's
  "same pattern as home/routines-list/history" note didn't anticipate this
  page already owning the bottom-fixed slot. Fix: that action bar is no
  longer `fixed` — it now sits in normal flow right after the form, and the
  page's existing `pb-28` keeps it clear of the now-fixed `<BottomNav/>`.
  Documented inline in the source.
- **Flujo**: `exercise-detail-page.tsx`'s "Volver" now calls `navigate(-1)`
  (was hardcoded to `/routines`). `routines-list-page.tsx`'s "Buscar" now
  toggles a client-side search input filtering the already-loaded routine
  list by name — new pure, unit-tested (TDD RED→GREEN, confirmed via a
  real import-resolution failure before restoring the implementation)
  `features/routines/lib/filter-routines.ts#filterRoutinesByName`, combined
  with the existing body-part filter (not replacing it).
  `workout-session-page.tsx`'s "Cerrar" (X) no longer navigates straight to
  `/history` — it opens a small confirmation overlay ("Sesión guardada" +
  explanatory text) with "Ir al inicio" (→ `/`) / "Seguir entrenando"
  (dismiss), so the user is told the session is saved and resumable before
  leaving, instead of silently landing on history.
- `npm run test` — **197/197 passed** (192 existing + 5 new
  `filter-routines.test.ts`, none broken). `npm run build` and `npm run
  lint` — clean. `npm run e2e` — **1/1 passed** against the real instance
  (no test markup depended on the changed button behaviors).

## PR10: Quick Reference sheet

See plan in `~/.claude/plans/velvety-purring-music.md` (section "PR10 —
Quick Reference sheet") for full context. New feature, contained: a global
bottom sheet (Figma node `16:1626`) invoked with a "?" button, no
business-logic changes.

- **Data**: `EXERCISE_COLUMNS`/`Exercise` in `features/exercises/api/exercises.ts`
  extended with `secondary_muscles`, `instructions`, `instruction_steps`
  (confirmed real columns via a live curl against the instance —
  `instruction_steps` is per-language-keyed (`{ en, es, ... }`) with an
  ARRAY of steps per language, unlike `instructions` (single paragraph per
  language); the sheet uses only `instruction_steps.es`).
- New pure, Strict-TDD fn (RED confirmed via a real import-resolution
  failure before the implementation existed, then GREEN):
  `features/exercises/lib/get-spanish-instruction-steps.ts#getSpanishInstructionSteps`
  — extracts `.es`, returns `[]` on missing/malformed/other-language-only
  input, never silently falls back to another language.
  `get-spanish-instruction-steps.test.ts`, 7 cases.
- `features/exercises/lib/equipment-icons.ts` (NEW) — the
  `EquipmentCategory → icon` `Record` extracted from
  `exercise-picker.tsx` (previously inline, now shared with the new sheet).
  Pure data extraction, no new logic.
- `features/exercises/components/quick-reference-sheet.tsx` (NEW) —
  `QuickReferenceSheet({ exerciseId, exercise?, open, onClose })`: name +
  equipment chip (icon via `equipment-icons.ts`) + target/secondary-muscle
  chips (`shared/ui/chip.tsx`) + numbered Spanish instruction steps (or
  "Instrucciones no disponibles en español" when empty) + "Ver detalle
  completo" (navigates to `/exercises/:id`, closes the sheet). Accepts an
  optional `exercise` prop to skip a redundant fetch when the caller
  already has it loaded (`useExerciseQuery`'s `enabled` flag is tied to
  `open && !exercise`); no anatomical body-silhouette — text/chips only,
  per the explicit already-taken decision.
- Wired from 2 places: `exercise-picker.tsx`'s `ExerciseResultItem` (a "?"
  `IconButton` sibling to the row's select-button, `stopPropagation`'d so
  it never fires `onSelect`; a nested `<button>` inside the row's own
  `<button>` would be invalid HTML, hence the sibling layout) and
  `workout-session-page.tsx`'s `CurrentExercisePanel` header (next to the
  `muscle_group` badge and "Saltar", passing the already-loaded
  `exerciseInfo` directly — no new fetch).
- `exercise-picker.test.tsx` updated: added a `useExerciseQuery` stub to
  its existing `use-exercises` mock (every result row now mounts a
  `QuickReferenceSheet`) and wrapped all `render()` calls in
  `<MemoryRouter>` (the sheet's "Ver detalle completo" needs
  `useNavigate()`, even when never clicked in these tests).
- `npm run test` — **204/204 passed** (197 existing + 7 new, none broken).
  `npm run build` and `npm run lint` — clean.

## PR11: Perfil + nombre editable

See plan in `~/.claude/plans/velvety-purring-music.md` (section "PR11 —
Pantalla de Perfil") for full context — plan PR9/10/11 completo, cerrado.
New screen (never part of the original 9-screen Figma set) plus an editable
display name, both contained/additive — no schema/migration change.

- **Nombre editable**: `updateDisplayName(displayName)` added to
  `features/auth/api/auth.ts` (Strict TDD: RED confirmed via
  `TypeError: updateDisplayName is not a function`, then GREEN), wrapping
  `supabase.auth.updateUser({ data: { display_name } })` — native Auth
  metadata, no new table/RLS (a single text field doesn't justify one, same
  reasoning already used for `user_equipment` NOT applying here). Unit
  tested (`auth.test.ts`, mocked `supabase.auth.updateUser`, 2 new cases:
  success + mapped error).
- **Extraction**: `greetingName()`/`initials()` moved out of `home-page.tsx`
  into `shared/lib/greeting-name.ts` / `shared/lib/initials.ts` (approval
  tests capturing the pre-existing behavior unchanged, 2 cases each) so both
  Home and Perfil reuse the exact same heuristics. New pure
  `shared/lib/resolve-display-name.ts#resolveDisplayName` (Strict TDD:
  RED confirmed via real import-resolution failure, then GREEN + 4 cases)
  prefers a trimmed, non-empty `session.user.user_metadata.display_name`
  over `greetingName(email)` — `home-page.tsx` and `profile-page.tsx` both
  call it, so they never disagree on the displayed name.
- **`features/auth/pages/profile-page.tsx`** (NEW, `/profile`): avatar
  (circular, `initials()`) + editable name (inline pencil-icon toggle →
  input + Guardar/Cancelar, loading/error states) + read-only email; stats
  card reusing `useHomeStatsQuery`/`home-stats.ts` (PR7) as-is, zero new
  query; "Ajustes" section linking to `/settings/equipment` (previously
  unreachable from the UI); "Cerrar sesión" (`signOut()` → `/login`);
  `<BottomNav/>` + `pb-28` + `min-h-dvh`, matching every other page's
  pattern. Deliberately NO body-measurement/height/weight/unit-preference
  fields — out of scope for v1 (single kg unit, no body measurements,
  already decided in the original spec).
- **`shared/ui/bottom-nav.tsx`**: "Perfil" tab is now a real `NavItem` (was
  a dimmed non-interactive `<span>` with a `TODO(future PR)`), same
  active/inactive treatment as the other 3 tabs.
- **`src/app/router.tsx`**: `/profile` wired under `ProtectedRoute`, same as
  every other authenticated route.
- **E2E regression found and fixed** (test-only, not production code):
  running `npm run e2e` for real (required by this PR, and never re-run for
  PR10 per its own note above) surfaced a real locator ambiguity introduced
  by PR10's "?" quick-reference `IconButton` — its
  `aria-label="Referencia rápida: {name}"` also contains the exercise name
  as a substring, so `getByRole('button', { name: exercise.name })` matched
  2 elements (the row's select-button AND the "?" button). Fixed in
  `e2e/full-flow.spec.ts` by anchoring the match to the START of the
  accessible name (`new RegExp('^' + escapeRegExp(exercise.name))`) — the
  row's name starts with the exercise name, the "?" button's starts with
  "Referencia rápida:" instead, so the two never collide. Not a PR11
  business-logic change; documented inline in the test file.
- `npm run test` — **214/214 passed** (204 existing + 10 new: 2
  `greeting-name.test.ts` + 2 `initials.test.ts` + 4
  `resolve-display-name.test.ts` + 2 new `auth.test.ts` cases, none broken).
  `npm run build` and `npm run lint` — clean.
- `npm run e2e` — **1/1 passed** against the real instance (after the
  locator fix above); confirms the existing flow (login → create routine →
  start workout → log set → reload/resume → finish → summary → exercise
  detail/records) is untouched by this PR's router/bottom-nav changes.

## Not implemented in these PRs

- `database.types.ts` generation — `src/shared/supabase/client.ts` still uses the `Record<string, unknown>` placeholder `Database` type. `features/routines/api/routines.ts` and `features/workout-session/api/workout-session.ts` work around this locally (documented inline) by casting to the untyped `SupabaseClient` default for `.from()` calls; revisit once real types are generated.
- Body measurements, height/weight, and a unit-preference setting — explicitly out of scope for v1 (single kg unit), as already decided in the original spec; not part of the Perfil screen (PR11) by design.
