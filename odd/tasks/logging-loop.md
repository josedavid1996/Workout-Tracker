# logging-loop

Objective: make logging a workout fast (one tap per set), following the recommendations in `docs/research/feature-gap.md`, with no timers of any kind.
Branch: `feat/logging-loop` (from `main` @ 33957c6). Delivery strategy: `ask-on-risk`; one work-unit commit per task; PR slicing pending the user's decision.
Test runner: `npx vitest run` (mocked, no network). Lint: `npm run lint`. Types: `npx tsc -b`.

## Specs

Scope is the list the assistant proposed and the user accepted with "si, actualiza el documento y aplcia todos los cambios que me propusistes". Standing constraint from the user: "no me gudta nada de agregar temporizador ni nada de eso".

- **S1** Update `docs/research/feature-gap.md` so its top 5 matches the accepted list (no rest timer).
- **S2** "Sets precargados al iniciar (M). Al empezar desde una rutina, crear las filas según las series objetivo, con las reps del plan y el peso de la última vez. La columna "Anterior" pasa a mostrar peso × reps de cada set, no solo el último peso repetido."
- **S3** "Inicio en un toque (S). Que "Hoy toca" use el día de la semana de la rutina y que su botón la inicie directamente, sin pasar por el selector."
- **S4** "Corregir en sesión (S). Editar, desmarcar y borrar cualquier set, y poder descartar un workout iniciado por error."
- **S5** "Pantalla siempre encendida (S). No es un temporizador: solo evita que el teléfono se bloquee mientras entrenas."
- **S6** "Sesión como lista completa (M). Ver todos los ejercicios en una sola pantalla, agregar uno en cualquier momento y sustituir uno por un similar, reutilizando las sugerencias que ya tienes."
- **S7** "Racha por semanas (S). Hoy cuentas días seguidos, así que cualquier día de descanso la rompe."
- **S8** "Notas visibles durante la sesión (S). Ya guardas una nota por ejercicio en la rutina, pero no se muestra al entrenar."
- **S9** "Resumen comparativo al terminar (M). Por ejercicio: hoy frente a la última vez."
- **S10** "Balance muscular (M). Sets por músculo por semana; tu tabla `exercise_focus` ya tiene el dato."
- **S11** "Editar sesiones pasadas (M). Hoy un workout terminado es de solo lectura."
- **S12** "Sugerencia de la siguiente carga (L, con migración). Si completaste todos los sets al objetivo, la próxima sesión abre con un poco más de peso."

Constraints (all specs): no new migration unless a spec says so; never modify `exercises`; no timers, countdowns or live duration; reuse `src/shared/ui/*`; pure logic in `lib/` with tests; data access only in `api/`.

Assumptions (assistant's, not the user's words):
- A1: S2 with no history for an exercise leaves the weight empty (stored 0, shown blank) until typed; completing a set copies its weight to the next still-empty set.
- A2: S2 when `target_sets` is empty uses the previous session's set count; with neither, no rows are created.
- A3: S6 replacing an exercise that already has completed sets keeps it and inserts the replacement right after it.
- A4: S12 needs a migration applied to the live Supabase instance, which only the user can do.

## Tasks

- [x] T0 · S1 · inline · b9674a0
- [x] T1 · S2 · inline · b9674a0 · RED→GREEN on the API tests; the pure lib tests were written together with the code
- [x] T2 · S3 · inline · 700fc9d · RED→GREEN (`featured-routine.test.ts`)
- [x] T3 · S4 · inline · d4c4d64 · RED→GREEN on the API tests; page tests written after the page
- [x] T4 · S5 · inline · a4c66db · RED→GREEN (`use-wake-lock.test.ts`)
- [x] T5 · S6 · inline · d4c4d64 · same commit as T3 (both rewrite `workout-session-page.tsx`)
- [x] T6 · S7 · inline · 1a8992a · RED→GREEN (`streak.test.ts`)
- [x] T7 · S8 · inline · d4c4d64 · covered by the page test ("routine note")
- [x] T8 · S9 · inline · 2850102 · RED→GREEN (`session-comparison.test.ts`)
- [x] T9 · S10 · inline · ba63162 · RED→GREEN (`muscle-balance.test.ts`, `history.test.ts`)
- [x] T10 · S11 · inline · 2850102 · RED→GREEN (page tests for a finished workout)
- [ ] T11 · S12 · blocked on A4 — **Needs your decision**: it needs a new migration applied to the live Supabase instance.

Route evidence: no Writer trigger fires (units share `workout-session-page.tsx` and `workout-session.ts`, so they are not disjoint); the parent wrote inline.

Review: `gentle-ai review assess --base-ref main --committed-only` → risk `medium`, `review_due: false` (`under_budget`) after b9674a0 and after ba63162; no native review started.

Delivery: 7 work-unit commits on `feat/logging-loop`, about 2,500 changed lines against `main` (over the ~400 heuristic). Not pushed; PR slicing (`stacked-to-main` or `feature-branch-chain`) is the user's call.

## Log

- L1 (2026-10-13, user): "si, actualiza el documento y aplcia todos los cambios que me propusistes"
- L2 (2026-10-13, user, earlier turn): "me gusta muchas cosas de openGym, pero no me gudta nada de agregar temporizador ni nada de eso, que me recomiendas agregar a Workout-Tracker"
- L3: Baseline on 33957c6: `npx vitest run` → 45 files, 408 tests passed.
- L4: `set_entries.created_at` (migration 0006) is documented as not applied to the live instance, so set order cannot rely on it; sets are ordered client-side (completed first by `completed_at`).
- L5: Not exercised against a real Supabase instance or a real phone: `npm run e2e` and `npm run test:rls` need live credentials. Verified with `npx vitest run` (53 files, 479 tests), `npx tsc -b`, `npm run lint`, `npm run build`.
- L6: `set_entries` deletes and the `workouts` delete rely on the existing `for all` owner policies (`0003_rls.sql`) and `on delete cascade` FKs (`0001_core_schema.sql`); no migration was added.
- L7: A swap is several separate writes (no transaction, no server layer); a failure midway can leave the original removed without its replacement. The page refetches after any swap so it shows what is really stored.
