import { beforeEach, describe, expect, it, vi } from 'vitest'

// Same minimal chainable Supabase query-builder mock used across other
// feature `api/` test files, extended with `in`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
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

import { fetchExerciseSetHistory } from './exercise-history'

beforeEach(() => {
  from.mockReset()
})

describe('fetchExerciseSetHistory', () => {
  it('fetches all set_entries for the exercise, joins each with its workout created_at, sorted newest first', async () => {
    const setsBuilder = makeQueryBuilder({
      data: [
        {
          id: 'set-1',
          workout_exercise_id: 'we-1',
          workout_id: 'workout-old',
          exercise_id: 'ex-a',
          weight: 90,
          reps: 8,
          tag: 'normal',
          completed: true,
          completed_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'set-2',
          workout_exercise_id: 'we-2',
          workout_id: 'workout-new',
          exercise_id: 'ex-a',
          weight: 100,
          reps: 5,
          tag: 'normal',
          completed: true,
          completed_at: '2026-02-01T00:00:00Z',
        },
      ],
      error: null,
    })
    const workoutsBuilder = makeQueryBuilder({
      data: [
        { id: 'workout-old', created_at: '2026-01-01T00:00:00Z' },
        { id: 'workout-new', created_at: '2026-02-01T00:00:00Z' },
      ],
      error: null,
    })

    from.mockImplementation((table: string) => (table === 'set_entries' ? setsBuilder : workoutsBuilder))

    const result = await fetchExerciseSetHistory('ex-a')

    expect(from).toHaveBeenCalledWith('set_entries')
    expect(setsBuilder.eq).toHaveBeenCalledWith('exercise_id', 'ex-a')
    expect(from).toHaveBeenCalledWith('workouts')
    expect(workoutsBuilder.in).toHaveBeenCalledWith('id', ['workout-old', 'workout-new'])

    expect(result.map((entry) => entry.id)).toEqual(['set-2', 'set-1'])
    expect(result[0].workout_created_at).toBe('2026-02-01T00:00:00Z')
  })

  it('returns an empty array without querying workouts when the exercise has no sets', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: [], error: null }))

    const result = await fetchExerciseSetHistory('ex-a')

    expect(result).toEqual([])
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('propagates a set_entries query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'boom' } }))

    await expect(fetchExerciseSetHistory('ex-a')).rejects.toEqual({ message: 'boom' })
  })
})
