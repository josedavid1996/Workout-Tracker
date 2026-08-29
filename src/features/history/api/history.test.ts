import { beforeEach, describe, expect, it, vi } from 'vitest'

// Same minimal chainable Supabase query-builder mock used across other
// feature `api/` test files, extended with `not`/`in`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    not: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

const from = vi.fn()

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
  },
}))

import { fetchHomeStats, fetchWorkoutHistory } from './history'

beforeEach(() => {
  from.mockReset()
})

const SET = (overrides: Record<string, unknown> = {}) => ({
  id: 'set-1',
  workout_exercise_id: 'we-1',
  workout_id: 'workout-1',
  exercise_id: 'ex-a',
  weight: 100,
  reps: 5,
  tag: 'normal',
  completed: true,
  completed_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('fetchWorkoutHistory', () => {
  it('fetches only finished workouts, newest first, with per-workout duration and countable volume', async () => {
    const workoutsBuilder = makeQueryBuilder({
      data: [
        {
          id: 'workout-1',
          routine_id: 'routine-1',
          created_at: '2026-01-01T00:00:00Z',
          finished_at: '2026-01-01T01:00:00Z',
          workout_exercises: [{ set_entries: [SET({ weight: 100, reps: 5 }), SET({ tag: 'warmup', completed: true })] }],
        },
      ],
      error: null,
    })
    const routinesBuilder = makeQueryBuilder({ data: [{ id: 'routine-1', name: 'Push day' }], error: null })

    from.mockImplementation((table: string) => (table === 'workouts' ? workoutsBuilder : routinesBuilder))

    const result = await fetchWorkoutHistory()

    expect(from).toHaveBeenCalledWith('workouts')
    expect(workoutsBuilder.not).toHaveBeenCalledWith('finished_at', 'is', null)
    expect(workoutsBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })

    expect(from).toHaveBeenCalledWith('routines')
    expect(routinesBuilder.in).toHaveBeenCalledWith('id', ['routine-1'])

    expect(result).toEqual([
      {
        id: 'workout-1',
        routineId: 'routine-1',
        routineName: 'Push day',
        createdAt: '2026-01-01T00:00:00Z',
        finishedAt: '2026-01-01T01:00:00Z',
        duration: '1h 0min',
        volume: 500, // only the countable (non-warmup) set counts
        setsCount: 1, // same countable filter — the warmup set is excluded
      },
    ])
  })

  it('sets routineName to null and skips the routines query for freestyle workouts', async () => {
    const workoutsBuilder = makeQueryBuilder({
      data: [
        {
          id: 'workout-2',
          routine_id: null,
          created_at: '2026-01-02T00:00:00Z',
          finished_at: '2026-01-02T00:30:00Z',
          workout_exercises: [],
        },
      ],
      error: null,
    })
    from.mockReturnValue(workoutsBuilder)

    const result = await fetchWorkoutHistory()

    expect(result[0].routineName).toBeNull()
    expect(from).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledWith('workouts')
  })

  it('returns an empty array when there are no finished workouts', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: [], error: null }))
    expect(await fetchWorkoutHistory()).toEqual([])
  })

  it('propagates a query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'boom' } }))
    await expect(fetchWorkoutHistory()).rejects.toEqual({ message: 'boom' })
  })
})

describe('fetchHomeStats', () => {
  it('aggregates sessions/volume/PR count over the same finished-workout rows', async () => {
    const workoutsBuilder = makeQueryBuilder({
      data: [
        {
          id: 'workout-2',
          routine_id: null,
          created_at: '2026-01-02T00:00:00Z',
          finished_at: '2026-01-02T01:00:00Z',
          workout_exercises: [{ set_entries: [SET({ id: 'set-2', workout_id: 'workout-2', weight: 120, reps: 5 })] }],
        },
        {
          id: 'workout-1',
          routine_id: null,
          created_at: '2026-01-01T00:00:00Z',
          finished_at: '2026-01-01T01:00:00Z',
          workout_exercises: [{ set_entries: [SET({ id: 'set-1', workout_id: 'workout-1', weight: 100, reps: 5 })] }],
        },
      ],
      error: null,
    })
    from.mockReturnValue(workoutsBuilder)

    const result = await fetchHomeStats()

    expect(result.sessions).toBe(2)
    expect(result.volumeKg).toBe(120 * 5 + 100 * 5)
    // The newest workout (workout-2) has the heavier set for ex-a → 1 PR.
    expect(result.prCount).toBe(1)
  })

  it('returns all zeros with no finished workouts', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: [], error: null }))
    expect(await fetchHomeStats()).toEqual({ sessions: 0, volumeKg: 0, prCount: 0 })
  })
})
