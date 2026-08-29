import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Phase 12 (SDD tasks artifact): one full happy-path E2E flow against the
// REAL Supabase instance behind `npm run dev` / `npm run preview` — never
// mocked. See `e2e/README.md` for how to run this.
//
// signup → create a routine with 1 exercise → start a workout from that
// routine → log 1 set → reload (resume the active session) → finish → see
// the summary → visit /exercises/:id and see it in the "Registro" section
// (PR8 replaced the History/Chart/Records tabs with one scrollable view —
// see `exercise-detail-page.tsx`).

const PASSWORD = 'E2eTest!Password123'

// Minimal regex-special-char escape for building an anchored `name` matcher
// from a real exercise name (see the "Agregar ejercicio" picker step below).
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function fetchRealExerciseId(): Promise<{ id: string; name: string }> {
  const url = process.env.VITE_SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in the environment running Playwright ' +
        '— see e2e/README.md (this reads process.env directly, same values as the app\'s .env).',
    )
  }

  // Read-only lookup against the pre-existing `exercises` table so this
  // test never hardcodes an assumed id/name — it takes whatever the first
  // row on the real instance actually is.
  const client = createClient(url, anonKey)
  const { data, error } = await client.from('exercises').select('id, name').limit(1).single()
  if (error || !data) {
    throw new Error(`Could not fetch a real exercise from 'exercises': ${error?.message ?? 'table is empty'}`)
  }
  return data as { id: string; name: string }
}

test('signup, log a workout end to end, resume after reload, and see it in exercise history', async ({ page }) => {
  const exercise = await fetchRealExerciseId()
  const email = `e2e-${Date.now()}@example.com`

  // --- Signup then login ---
  // Signup on this instance's login-page never auto-navigates (it always
  // shows "revisá tu email"), even with mailer_autoconfirm on, so this test
  // explicitly logs in right after via the same form's login tab.
  //
  // `shared/ui/tabs.tsx` renders the login/signup mode toggle with an
  // explicit `role="tab"` on each `<button>` (inside a `role="tablist"`),
  // which overrides its implicit "button" accessible role — so the toggle
  // must be targeted via `getByRole('tab', ...)`, distinct from the actual
  // submit `getByRole('button', ...)`, which shares the same visible label
  // but a different accessible role and therefore never collides with it.
  // (`Tabs` itself is untouched by PR8 — only `exercise-detail-page.tsx`
  // stopped using it, in favor of one scrollable view.)
  await page.goto('/login')
  await page.getByRole('tab', { name: 'Crear cuenta' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('Revisá tu email')).toBeVisible()

  await page.getByRole('tab', { name: 'Iniciar sesión' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(PASSWORD)
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL('/')

  // --- Create a routine with 1 exercise ---
  await page.goto('/routines/new')
  await page.getByLabel('Nombre').fill('E2E Routine')
  await page.getByRole('button', { name: 'Agregar ejercicio' }).click()
  await page.getByPlaceholder('Buscar ejercicio...').fill(exercise.name)
  // PR10 added a sibling "?" quick-reference `IconButton` per result row
  // (`aria-label="Referencia rápida: {name}"`), whose accessible name also
  // contains `exercise.name` as a substring — a plain `name: exercise.name`
  // match is ambiguous between it and the row's own select-button. The row
  // button's accessible name STARTS WITH the exercise name (name + muscle
  // group/equipment), while the "?" button's name starts with "Referencia
  // rápida:" instead, so anchoring the regex at the start disambiguates them
  // without depending on exact/full text.
  await page
    .getByRole('button', { name: new RegExp(`^${escapeRegExp(exercise.name)}`) })
    .click()
  // `exact: true` — plain "Agregar" is a substring of "Agregar ejercicio"
  // (the picker-opening button, still on screen behind this Sheet), so a
  // non-exact match would be ambiguous between the two.
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  await page.getByRole('button', { name: 'Guardar rutina' }).click()
  await expect(page).toHaveURL('/routines')

  // --- Start a workout from that routine ---
  // PR8 (visual rebuild): each saved routine on `/workout/start` is now one
  // big tappable card (routine name + "N EJ · ~M MIN"), not a separate
  // "Empezar" button next to the name — see `workout-start-page.tsx`.
  await page.goto('/workout/start')
  await page.getByRole('button', { name: 'E2E Routine' }).click()
  await expect(page).toHaveURL(/\/workout\/[0-9a-f-]+$/)
  const workoutUrl = page.url()

  // --- Log 1 set ---
  await page.getByRole('button', { name: 'Agregar set' }).click()
  await expect(page.getByRole('spinbutton').first()).toBeVisible()

  // --- Reload: the active session must be RESUMED (finished_at IS NULL) ---
  // with the set already logged, not a fresh/empty session.
  await page.reload()
  await expect(page).toHaveURL(workoutUrl)
  // The set row's weight/reps inputs must already be there — resumed from
  // `resumeActiveWorkout()` + `fetchWorkout()`, not a fresh empty session.
  await expect(page.getByRole('spinbutton').first()).toBeVisible()

  // --- Finish the workout ---
  // PR8: the "Terminar entrenamiento" footer button was replaced by a
  // "Terminar" action in the sticky header (green, next to the close "X").
  await page.getByRole('button', { name: 'Terminar' }).click()
  await expect(page).toHaveURL(/\/workout\/[0-9a-f-]+\/summary$/)

  // --- Summary: real layout (grid of stat-tiles, no plain "Duración"/
  // "Volumen (kg)" text rows anymore) ---
  await expect(page.getByText('Workout completado')).toBeVisible()
  await expect(page.getByText('Volumen kg')).toBeVisible()

  // --- Exercise detail: PR8 replaced the 3 History/Chart/Records tabs with
  // ONE scrollable view (stats -> chart -> "Registro") — see
  // `exercise-detail-page.tsx` and `design/figma-reference/09-detalle-ejercicio.md`.
  await page.goto(`/exercises/${exercise.id}`)
  await expect(page.getByRole('heading', { name: exercise.name })).toBeVisible()
  await expect(page.getByText('Registro')).toBeVisible()
})
