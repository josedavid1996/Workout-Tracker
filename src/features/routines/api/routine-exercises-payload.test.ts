import { describe, expect, it } from 'vitest'
import { toRoutineExerciseRows } from './routine-exercises-payload'

describe('toRoutineExerciseRows', () => {
  it('returns an empty array for an empty draft list', () => {
    expect(toRoutineExerciseRows('routine-1', 'user-1', [])).toEqual([])
  })

  it('assigns 0-based position matching draft order', () => {
    const rows = toRoutineExerciseRows('routine-1', 'user-1', [
      { exerciseId: 'ex-a', targetSets: 3, targetReps: '8-10' },
      { exerciseId: 'ex-b', targetSets: null, targetReps: null },
    ])

    expect(rows).toEqual([
      {
        routine_id: 'routine-1',
        user_id: 'user-1',
        exercise_id: 'ex-a',
        position: 0,
        target_sets: 3,
        target_reps: '8-10',
      },
      {
        routine_id: 'routine-1',
        user_id: 'user-1',
        exercise_id: 'ex-b',
        position: 1,
        target_sets: null,
        target_reps: null,
      },
    ])
  })

  it('recomputes position from array order, not from any prior index', () => {
    const rows = toRoutineExerciseRows('routine-1', 'user-1', [
      { exerciseId: 'ex-c', targetSets: 5, targetReps: '5' },
      { exerciseId: 'ex-a', targetSets: 3, targetReps: '8-10' },
      { exerciseId: 'ex-b', targetSets: null, targetReps: null },
    ])

    expect(rows.map((row) => row.exercise_id)).toEqual(['ex-c', 'ex-a', 'ex-b'])
    expect(rows.map((row) => row.position)).toEqual([0, 1, 2])
  })
})
