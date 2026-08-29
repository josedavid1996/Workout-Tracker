-- Indexes supporting Workout Tracker query patterns
-- (list/history ordering, single active workout, and progress lookups).

create index routines_user_created_idx on routines (user_id, created_at desc);
create index routine_exercises_routine_pos_idx on routine_exercises (routine_id, position);
create index workouts_user_created_idx on workouts (user_id, created_at desc);
create unique index workouts_single_active_idx on workouts (user_id) where finished_at is null;
create index workout_exercises_workout_pos_idx on workout_exercises (workout_id, position);
create index set_entries_we_idx on set_entries (workout_exercise_id);
create index set_entries_progress_idx
  on set_entries (user_id, exercise_id, completed_at desc)
  include (weight, reps, workout_id)
  where completed and tag <> 'warmup';
