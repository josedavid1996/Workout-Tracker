-- Row Level Security: every user can only access their own rows.
-- Applies to all 6 tables introduced in 0001_core_schema.sql.
-- `exercises` is a pre-existing, read-only, shared table and is out of scope here.

alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workouts enable row level security;
alter table workout_exercises enable row level security;
alter table set_entries enable row level security;
alter table user_equipment enable row level security;

create policy routines_owner on routines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy routine_exercises_owner on routine_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy workouts_owner on workouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy workout_exercises_owner on workout_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy set_entries_owner on set_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_equipment_owner on user_equipment
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
