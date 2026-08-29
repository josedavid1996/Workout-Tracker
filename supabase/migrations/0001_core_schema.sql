-- Core schema for Workout Tracker.
-- Assumes the `exercises` table already exists (pre-populated, read-only).
-- Do NOT modify `exercises` here.

create type set_tag as enum ('normal', 'warmup', 'drop', 'failure');

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null,
  exercise_id text not null references exercises(id),
  position int not null,
  target_sets int,
  target_reps text,
  foreign key (routine_id, user_id) references routines(id, user_id) on delete cascade
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  foreign key (routine_id, user_id) references routines(id, user_id) on delete set null,
  unique (id, user_id)
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null,
  exercise_id text not null references exercises(id),
  position int not null,
  foreign key (workout_id, user_id) references workouts(id, user_id) on delete cascade,
  unique (id, user_id, workout_id, exercise_id)
);

create table set_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null,
  workout_id uuid not null,
  exercise_id text not null references exercises(id),
  weight double precision not null check (weight >= 0),
  reps int not null check (reps > 0),
  tag set_tag not null default 'normal',
  completed boolean not null default false,
  completed_at timestamptz,
  foreign key (workout_exercise_id, user_id, workout_id, exercise_id)
    references workout_exercises(id, user_id, workout_id, exercise_id) on delete cascade
);

create table user_equipment (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bar_weight double precision not null default 20,
  plate_inventory jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
