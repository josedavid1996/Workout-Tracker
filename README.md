# Workout Tracker

Vite + React + TypeScript workout tracking app, backed by a self-hosted
Supabase instance.

## Status

**PR6 (final)**: all 6 planned PRs are done — see `tasks.md` for the full
phase-by-phase breakdown (Phases 1–10) and the note below for Phases
11–12 (this PR).

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- react-router-dom
- @tanstack/react-query
- Recharts
- @supabase/supabase-js
- Vitest (`@testing-library/react`) for unit/component tests — fully
  mocked, no network
- Playwright for E2E tests
- A separate Vitest project (`vitest.rls.config.ts`) for RLS integration
  tests — the only tests in this repo that hit a real network

## Getting started

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase instance URL. |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key. Not committed — fill in your own local value. |

`.env` is gitignored; `.env.example` is the committed template.

## Database

SQL migrations live in `supabase/migrations/` — see
`supabase/migrations/README.md` for how to apply them (`supabase db
push` or `psql`) and how to generate `src/shared/supabase/database.types.ts`
afterwards.

## Scripts

| Command | Purpose | Needs a real instance? |
|---|---|---|
| `npm run dev` | Start the Vite dev server. | — |
| `npm run build` | Type-check and build for production. | No |
| `npm run lint` | Run oxlint. | No |
| `npm run test` | Run the mocked Vitest suite once. | **No** |
| `npm run test:watch` | Same, in watch mode. | No |
| `npm run test:coverage` | Same, with coverage. | No |
| `npm run test:rls` | RLS integration suite (Phase 11) — real users, real RLS/FK/index checks. | **Yes** |
| `npm run e2e` | Full E2E flow (Phase 12) against a live dev/preview server. | **Yes** |
| `npm run e2e:ui` | Same, in Playwright UI mode. | **Yes** |

### Tests against the real instance

`npm run test` (128+ tests) never touches the network — every Supabase
call is mocked. Two things intentionally DO run against a real, reachable
Supabase instance instead, and are kept out of the default `test` command
for that exact reason:

- **`npm run test:rls`** — see `supabase/tests/README.md`. Creates 2 real
  auth users and checks row isolation, `countable_sets` RPC scoping under
  RLS, the composite-FK rejection of a forged `user_id`, and the
  single-active-workout unique index.
- **`npm run e2e`** — see `e2e/README.md`. One signup → routine → workout
  → resume-after-reload → finish → history/chart/records flow through the
  real UI and a real browser.

Both need a real `.env` (see above) pointed at a reachable instance with
at least 1 row in `exercises`, and both leave real (harmless, unused) auth
users behind — neither has a service-role key to delete them with.

## Project structure

```
src/
  app/              # router, providers, query client, route guards
  features/         # auth, routines, workout-session, history, exercises, equipment
  shared/
    supabase/       # Supabase client + generated types
    lib/            # pure domain logic
    ui/             # presentational components
supabase/
  migrations/       # ordered SQL migrations (schema, indexes, RLS, functions)
  tests/            # RLS integration tests against the real instance (Phase 11)
e2e/                # Playwright E2E specs against the real instance (Phase 12)
```
