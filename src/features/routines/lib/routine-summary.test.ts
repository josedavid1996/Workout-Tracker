import { describe, expect, it } from 'vitest'
import { dominantBodyPart, estimateWorkoutMinutes } from './routine-summary'

describe('estimateWorkoutMinutes', () => {
  it('returns 0 for no exercises', () => {
    expect(estimateWorkoutMinutes(0)).toBe(0)
  })

  it('scales linearly with a documented per-exercise minute heuristic', () => {
    expect(estimateWorkoutMinutes(1)).toBe(8)
    expect(estimateWorkoutMinutes(5)).toBe(40)
  })
})

describe('dominantBodyPart', () => {
  it('returns null for an empty list', () => {
    expect(dominantBodyPart([])).toBeNull()
  })

  it('returns null when every value is null', () => {
    expect(dominantBodyPart([null, null])).toBeNull()
  })

  it('returns the most frequent non-null body part', () => {
    expect(dominantBodyPart(['chest', 'chest', 'back'])).toBe('chest')
  })

  it('breaks ties by first-seen order', () => {
    expect(dominantBodyPart(['back', 'chest'])).toBe('back')
  })

  it('ignores nulls when counting', () => {
    expect(dominantBodyPart([null, 'legs', 'legs'])).toBe('legs')
  })
})
