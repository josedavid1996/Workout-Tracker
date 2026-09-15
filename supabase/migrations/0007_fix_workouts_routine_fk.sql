-- `0001_core_schema.sql`'s `workouts` table declared a COMPOSITE foreign
-- key: `foreign key (routine_id, user_id) references routines(id, user_id)
-- on delete set null`. Postgres's `ON DELETE SET NULL` on a multi-column
-- FK nulls EVERY column in that FK's own tuple, not just the nullable
-- one — so deleting a routine that was ever used in a workout also nulled
-- `workouts.user_id`, which violates that column's own `not null`
-- constraint and aborted the whole DELETE.
--
-- Confirmed live against the real instance: deleting a routine used in a
-- finished workout failed with
--   {"code":"23502", "message":"null value in column \"user_id\" of
--   relation \"workouts\" violates not-null constraint"}
-- — meaning NO routine that was ever used in a workout could be deleted
-- at all.
--
-- Fix: drop the composite FK and replace it with a plain, single-column
-- one on `routine_id` alone, so `ON DELETE SET NULL` only ever touches
-- `routine_id`. The cross-user_id check the composite FK also provided
-- (a workout's user_id matching its routine's user_id) is already
-- guaranteed at the application layer — RLS scopes every routine read to
-- `auth.uid() = user_id`, so a user can never even see, let alone set, a
-- routine_id belonging to someone else.
do $$
declare
  fk_name text;
begin
  select c.conname into fk_name
  from pg_constraint c
  where c.conrelid = 'public.workouts'::regclass
    and c.contype = 'f'
    and c.confrelid = 'public.routines'::regclass
  limit 1;

  if fk_name is not null then
    execute format('alter table workouts drop constraint %I', fk_name);
  end if;
end $$;

alter table workouts
  add constraint workouts_routine_id_fkey
  foreign key (routine_id) references routines(id) on delete set null;
