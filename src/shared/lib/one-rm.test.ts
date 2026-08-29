import { describe, expect, it } from 'vitest'
import { estimateOneRm } from './one-rm'

describe('estimateOneRm', () => {
  it('computes the Brzycki 1RM for a low rep count', () => {
    const result = estimateOneRm(100, 5)
    expect(result).not.toBeNull()
    expect(result!.value).toBeCloseTo(112.5, 5)
    expect(result!.lowConfidence).toBe(false)
  })

  it('computes the Brzycki 1RM for another low rep count', () => {
    const result = estimateOneRm(100, 8)
    expect(result!.value).toBeCloseTo(3600 / 29, 5)
    expect(result!.lowConfidence).toBe(false)
  })

  it('does not mark lowConfidence at exactly 12 reps', () => {
    const result = estimateOneRm(100, 12)
    expect(result!.lowConfidence).toBe(false)
  })

  it('marks lowConfidence once reps exceed 12', () => {
    const result = estimateOneRm(100, 13)
    expect(result!.lowConfidence).toBe(true)
  })

  it('returns null at reps=37 (the formula is undefined there)', () => {
    expect(estimateOneRm(100, 37)).toBeNull()
  })

  it('returns null for rep counts beyond 37', () => {
    expect(estimateOneRm(100, 50)).toBeNull()
  })

  it('returns value 0 for weight=0 without throwing', () => {
    const result = estimateOneRm(0, 5)
    expect(result).not.toBeNull()
    expect(result!.value).toBe(0)
    expect(result!.lowConfidence).toBe(false)
  })
})
