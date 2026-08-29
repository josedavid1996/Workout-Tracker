# Migrations

Ordered SQL migrations for the Workout Tracker schema. **Not yet applied** to
the target instance (`http://192.168.101.5:8000`) — this environment has no
service-role credentials, so applying them is left to whoever holds those
credentials.

| File | Purpose |
|---|---|
| `0001_core_schema.sql` | Tables: `routines`, `routine_exercises`, `workouts`, `workout_exercises`, `set_entries`, `user_equipment`, plus the `set_tag` enum. Does not touch the pre-existing `exercises` table. |
| `0002_indexes.sql` | Supporting indexes, including the single-active-workout unique index and the progress lookup index. |
| `0003_rls.sql` | Enables RLS and adds an `auth.uid() = user_id` owner policy on all 6 new tables. |
| `0004_functions.sql` | `countable_sets(p_exercise_id text)` — the single implementation of the "completed, non-warmup" set filter. Consume this function rather than re-implementing the filter elsewhere. |
| `0005_failure_reps_zero.sql` | Relaxes `set_entries`'s `reps` check constraint so a `failure`-tagged set may log `reps = 0`; every other tag keeps `reps > 0`. Added in PR4 (Phase 8, set-tagging) — **not yet applied** here either, same caveat as 0001–0004 (no service-role credentials in this environment). |

## Applying

With the Supabase CLI linked to the target project:

```bash
supabase db push
```

Or apply the files in order directly with `psql` against the instance if you
are not using the CLI's migration tracking.

## Generating TypeScript types (after applying)

Once migrations are applied, generate `src/shared/supabase/database.types.ts`:

```bash
supabase gen types typescript --project-id <project-id> \
  --schema public > src/shared/supabase/database.types.ts
```

See `src/shared/supabase/README.md` for the full instructions and how to wire
the generated types into the Supabase client.
