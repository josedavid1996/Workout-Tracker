# e2e

Playwright test directory. `full-flow.spec.ts` (Phase 12) is the one
happy-path E2E scenario, run against the **REAL** Supabase instance
through a live `npm run dev` (or `npm run build && npm run preview`)
server — never mocked.

## What it covers

Signup → login (this instance's login page never auto-navigates after
signup, even with `mailer_autoconfirm` on — it always shows "revisá tu
email", so the test explicitly logs in right after) → create a routine
with 1 real exercise (looked up from the `exercises` table, never
hardcoded) → start a workout from that routine → log 1 set → **reload the
page** and confirm the active session is *resumed* (`finished_at IS
NULL` + `resumeActiveWorkout()`) with the set still there, not a fresh
session → finish the workout → see the summary (duration, volume) → visit
`/exercises/:id` for that exercise and confirm it shows up in
History/Chart/Records.

## Running it

```bash
npm run e2e        # headless
npm run e2e:ui     # Playwright UI mode
```

Requires:

- A real `.env` at the repo root (copy `.env.example`, fill in
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`). `playwright.config.ts`
  loads it via `dotenv/config` for the test process itself (used to look
  up a real `exercise_id`); the browser side gets the same values through
  Vite's own `.env` loading when `npm run dev` starts.
- The target Supabase instance reachable from wherever Playwright runs,
  with at least 1 row in `exercises` and `mailer_autoconfirm` on (so
  `signIn` right after `signUp` succeeds without an email-confirmation
  step).
- `playwright.config.ts`'s `webServer` starts `npm run dev` automatically
  and reuses an already-running one at `http://localhost:5173` outside CI
  — no separate manual start needed.

This test creates one more real, permanent auth user per run
(`e2e-<timestamp>@example.com`) — same caveat as
`supabase/tests/README.md`: deleting it needs the admin API/service-role
key, which isn't available to this suite.
