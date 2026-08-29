-- `countable_sets` is the single source of truth for the "countable set" filter
-- (completed = true and tag <> 'warmup'). No other code path — client or SQL —
-- should re-implement this filter; consume this function instead so the rule
-- never drifts between call sites.
--
-- security invoker: runs with the calling user's privileges, so RLS on
-- set_entries (see 0003_rls.sql) still applies and scopes results to that user.

create function countable_sets(p_exercise_id text)
returns setof set_entries
language sql
security invoker
stable
as $$
  select *
  from set_entries
  where exercise_id = p_exercise_id
    and completed = true
    and tag <> 'warmup';
$$;
