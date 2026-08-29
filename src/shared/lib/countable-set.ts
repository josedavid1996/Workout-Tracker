export type SetTag = 'normal' | 'warmup' | 'drop' | 'failure'

// A set entry that has already been filtered through `isCountable`.
export type CountableSet = {
  id: string
  exerciseId: string
  weight: number
  reps: number
  completedAt: string
  workoutId: string
}

// Single source of truth (client-side) for the "countable set" filter.
// Must stay semantically identical to `countable_sets()` in
// `supabase/migrations/0004_functions.sql`: completed = true and tag <> 'warmup'.
// `failure` and `drop` sets DO count as long as they are completed — only
// `warmup` is excluded regardless of completion.
export function isCountable(set: { completed: boolean; tag: SetTag }): boolean {
  return set.completed && set.tag !== 'warmup'
}
