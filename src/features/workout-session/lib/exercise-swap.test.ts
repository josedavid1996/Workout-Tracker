import { describe, expect, it } from 'vitest'
import { planExerciseSwap } from './exercise-swap'

const others = [
  { id: 'we-0', position: 0 },
  { id: 'we-2', position: 2 },
  { id: 'we-3', position: 3 },
]

describe('planExerciseSwap', () => {
  it('replaces an exercise with no completed sets in place, keeping its set count and reps', () => {
    const plan = planExerciseSwap({
      target: {
        id: 'we-1',
        position: 1,
        sets: [
          { completed: false, reps: 10 },
          { completed: false, reps: 10 },
          { completed: false, reps: 8 },
        ],
      },
      others,
    })

    expect(plan).toEqual({ removeOriginal: true, insertPosition: 1, shifts: [], setCount: 3, reps: 10 })
  })

  it('keeps an exercise that has completed sets and inserts the replacement right after it', () => {
    const plan = planExerciseSwap({
      target: {
        id: 'we-1',
        position: 1,
        sets: [
          { completed: true, reps: 12 },
          { completed: false, reps: 12 },
        ],
      },
      others,
    })

    expect(plan).toEqual({
      removeOriginal: false,
      insertPosition: 2,
      shifts: [
        { id: 'we-2', position: 3 },
        { id: 'we-3', position: 4 },
      ],
      setCount: 2,
      reps: 12,
    })
  })

  it('carries no rep count when the replaced exercise had no sets', () => {
    expect(planExerciseSwap({ target: { id: 'we-1', position: 1, sets: [] }, others })).toEqual({
      removeOriginal: true,
      insertPosition: 1,
      shifts: [],
      setCount: 0,
      reps: null,
    })
  })
})
