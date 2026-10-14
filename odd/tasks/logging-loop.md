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

- [x] T0 · S1 · inline · doc updated (commit with T1)
- [ ] T1 · S2 · inline
- [ ] T2 · S3 · inline
- [ ] T3 · S4 · inline
- [ ] T4 · S5 · inline
- [ ] T5 · S6 · inline
- [ ] T6 · S7 · inline
- [ ] T7 · S8 · inline
- [ ] T8 · S9 · inline
- [ ] T9 · S10 · inline
- [ ] T10 · S11 · inline
- [ ] T11 · S12 · blocked on A4 (needs the user's decision)

Route evidence: no Writer trigger fires (units share `workout-session-page.tsx` and `workout-session.ts`, so they are not disjoint); the parent writes inline.

## Log

- L1 (2026-10-13, user): "si, actualiza el documento y aplcia todos los cambios que me propusistes"
- L2 (2026-10-13, user, earlier turn): "me gusta muchas cosas de openGym, pero no me gudta nada de agregar temporizador ni nada de eso, que me recomiendas agregar a Workout-Tracker"
- L3: Baseline on 33957c6: `npx vitest run` → 45 files, 408 tests passed.
- L4: `set_entries.created_at` (migration 0006) is documented as not applied to the live instance, so set order cannot rely on it; sets are ordered client-side (completed first by `completed_at`).
