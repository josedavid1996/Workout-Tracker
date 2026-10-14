import { FALLBACK_REPS, parsePlannedRepsLowerBound } from './new-set-defaults'

// Set rows created up-front when a workout starts from a routine, so logging
// a set is "check what was planned" instead of "create a row, then confirm".

export type PreviousSet = { weight: number; reps: number }

// `weight: null` = no history to prefill from — stored as 0 and shown empty
// until the user types a value (see `session-sets.ts#isWeightMissing`).
export type PrefilledSet = { weight: number | null; reps: number }

export type PrefillInput = {
  targetSets: number | null
  targetReps: string | null
  // The same exercise's countable sets from its most recent other workout,
  // in the order they were done.
  previousSets: PreviousSet[]
}

// Row count: the routine's `target_sets`, else as many sets as last time.
// Weight: the matching set from last time (the last one repeats when the
// plan now has more sets). Reps: the plan's lower bound, else last time's —
// except a 0-rep failure set, which only the `failure` tag may store
// (0005_failure_reps_zero.sql) while these rows are created as `normal`.
export function buildPrefilledSets({ targetSets, targetReps, previousSets }: PrefillInput): PrefilledSet[] {
  const count = targetSets ?? previousSets.length
  if (count <= 0) return []

  const plannedReps = parsePlannedRepsLowerBound(targetReps)
  const lastPrevious = previousSets.at(-1) ?? null

  return Array.from({ length: count }, (_, index) => {
    const previous = previousSets[index] ?? lastPrevious
    return {
      weight: previous?.weight ?? null,
      reps: plannedReps ?? (previous && previous.reps > 0 ? previous.reps : FALLBACK_REPS),
    }
  })
}

export type CountableSetRow = {
  workout_id: string
  workout_exercise_id?: string
  weight: number
  reps: number
  completed_at: string | null
}

function completedTime(row: CountableSetRow): number {
  return new Date(row.completed_at ?? 0).getTime()
}

// Picks, out of every countable set of one exercise, the sets of the most
// recent workout other than `excludeWorkoutId`, oldest-first. When that
// workout had the exercise more than once (e.g. heavy sets, then back-off
// sets later on), `occurrence` selects which of those blocks, in the order
// they were started.
export function pickPreviousSessionSets(
  rows: CountableSetRow[],
  excludeWorkoutId: string,
  occurrence = 0,
): PreviousSet[] {
  const candidates = rows.filter((row) => row.workout_id !== excludeWorkoutId)
  if (candidates.length === 0) return []

  const latest = candidates.reduce((best, row) => (completedTime(row) > completedTime(best) ? row : best))

  const blocks = new Map<string, PreviousSet[]>()
  const latestRows = candidates
    .filter((row) => row.workout_id === latest.workout_id)
    .sort((a, b) => completedTime(a) - completedTime(b))

  for (const row of latestRows) {
    const key = row.workout_exercise_id ?? ''
    const block = blocks.get(key) ?? []
    block.push({ weight: row.weight, reps: row.reps })
    blocks.set(key, block)
  }

  return Array.from(blocks.values())[occurrence] ?? []
}

// For a list of exercise ids in workout order: which repeat of its exercise
// each entry is (0 for the first time it appears, 1 for the second, ...).
export function occurrenceIndexes(exerciseIds: string[]): number[] {
  const seen = new Map<string, number>()
  return exerciseIds.map((exerciseId) => {
    const index = seen.get(exerciseId) ?? 0
    seen.set(exerciseId, index + 1)
    return index
  })
}
