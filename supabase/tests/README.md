# RLS integration tests (Phase 11)

Vitest suite that runs against the **REAL** Supabase instance — never
mocked, never jsdom. Everything else in this repo (`npm run test`, 128
tests) runs fully mocked/offline; this is the one exception.

## What it covers

`rls.rls.test.ts` creates two real auth users (`test-a-*@example.com` /
`test-b-*@example.com`, via `supabase.auth.signUp()`) and one
supabase-js client authenticated as each, then checks:

- **Row isolation** (`routines`, `workouts`, `set_entries`,
  `routine_exercises`, `workout_exercises`, `user_equipment`): user B cannot
  `select`/`update`/`delete` a row owned by user A.
- **`countable_sets` RPC respects RLS**: user B calling the function with
  user A's `exercise_id` never sees A's sets, even though `security
  invoker` runs the function with the caller's own privileges.
- **Composite FK rejects a forged `user_id`**: inserting a
  `routine_exercises` row with a real `routine_id` that belongs to a
  different user than the one on the row fails with a **foreign key
  violation (Postgres `23503`)**, not an RLS denial (`42501`) — the simple
  `auth.uid() = user_id` check on the row passes on its own; only the
  composite `(routine_id, user_id) references routines(id, user_id)`
  catches the mismatch. Both are documented in the test itself.
- **Single active workout unique index**: starting a second workout with
  `finished_at IS NULL` while one is already active fails with a **unique
  violation (`23505`)** — `workouts_single_active_idx`.

## Running it

```bash
npm run test:rls
```

This is **not** part of `npm run test` — it's excluded from
`vite.config.ts`'s Vitest config and has its own config
(`vitest.rls.config.ts`) and script, specifically so the normal test suite
never needs network access or real credentials.

Requires a real `.env` at the repo root (copy `.env.example`, fill in
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for a reachable instance).
Vitest loads `.env` the same way Vite does, so no extra setup is needed
beyond that file existing.

## Cleanup (Phase 11.5)

Every row this suite creates is deleted in `afterAll`, as the owning
user's client (RLS-safe — no service-role key is used or needed anywhere
here). `on delete cascade` on `routines`/`workouts` handles their children
automatically, so the suite only tracks top-level rows plus standalone
`user_equipment` rows.

**What is *not* cleaned up**: the two test auth users themselves
(`test-a-*`/`test-b-*@example.com`). Deleting a user needs the GoTrue
admin API / a service-role key, and this suite only ever uses the anon
key — by design, to test the exact same permission surface the app itself
has. Every run leaves 2 more confirmed-but-unused auth users on the
target instance. If that matters for the target instance, prune them
periodically with the admin API/service-role key from outside this suite.
