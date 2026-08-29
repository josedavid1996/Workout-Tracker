import { describe, expect, it } from 'vitest'
import type { SetEntry } from '../api/workout-session'
import { toCountableSet } from './to-countable-set'

describe('toCountableSet', () => {
  it('maps a snake_case SetEntry to the camelCase CountableSet shape', () => {
    const entry: SetEntry = {
      id: 'set-1',
      workout_exercise_id: 'we-1',
      workout_id: 'workout-1',
      exercise_id: 'ex-a',
      weight: 100,
      reps: 8,
      tag: 'normal',
      completed: true,
      completed_at: '2026-01-01T00:00:00Z',
    }

    expect(toCountableSet(entry)).toEqual({
      id: 'set-1',
      exerciseId: 'ex-a',
      weight: 100,
      reps: 8,
      completedAt: '2026-01-01T00:00:00Z',
      workoutId: 'workout-1',
    })
  })

  it('falls back to an empty completedAt when completed_at is null', () => {
    const entry: SetEntry = {
      id: 'set-1',
      workout_exercise_id: 'we-1',
      workout_id: 'workout-1',
      exercise_id: 'ex-a',
      weight: 100,
      reps: 8,
      tag: 'normal',
      completed: false,
      completed_at: null,
    }

    expect(toCountableSet(entry).completedAt).toBe('')
  })
})
