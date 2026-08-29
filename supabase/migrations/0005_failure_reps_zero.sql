-- PR4 (Phase 8, set-tagging) requires a `failure` set to be loggable with
-- `reps = 0` (missed the rep entirely at failure). `0001_core_schema.sql`'s
-- original `check (reps > 0)` on `set_entries.reps` predates this
-- requirement and blocks it for every tag, including `failure`.
--
-- Drops whatever check constraint Postgres generated for that column
-- (looked up dynamically instead of assuming the default
-- `set_entries_reps_check` name, in case it differs on the target
-- instance) and replaces it with one that keeps `reps > 0` for every tag
-- except `failure`, which may additionally be `0`.

do $$
declare
  existing_constraint text;
begin
  select conname into existing_constraint
  from pg_constraint
  where conrelid = 'set_entries'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%reps%'
  limit 1;

  if existing_constraint is not null then
    execute format('alter table set_entries drop constraint %I', existing_constraint);
  end if;
end $$;

alter table set_entries
  add constraint set_entries_reps_check check (reps > 0 or tag = 'failure');
