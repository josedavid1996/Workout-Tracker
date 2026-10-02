import { describe, expect, it } from 'vitest'
import { FALLBACK_REPS, newSetDefaults, parsePlannedRepsLowerBound, parseWeightInput } from './new-set-defaults'

describe('parsePlannedRepsLowerBound', () => {
  it('takes the lower bound of a range', () => {
    expect(parsePlannedRepsLowerBound('8-10')).toBe(8)
    expect(parsePlannedRepsLowerBound(' 6 – 8 ')).toBe(6)
  })

  it('parses a single number', () => {
    expect(parsePlannedRepsLowerBound('12')).toBe(12)
  })

  it('returns null for missing, non-numeric or zero targets', () => {
    expect(parsePlannedRepsLowerBound(null)).toBeNull()
    expect(parsePlannedRepsLowerBound('')).toBeNull()
    expect(parsePlannedRepsLowerBound('AMRAP')).toBeNull()
    expect(parsePlannedRepsLowerBound('0')).toBeNull()
  })
})

describe('newSetDefaults', () => {
  it('copies the previous set of the same exercise in this session first', () => {
    expect(newSetDefaults({ previousSet: { weight: 60, reps: 9 }, lastWeight: 50, plannedReps: '8-10' })).toEqual({
      weight: 60,
      reps: 9,
    })
  })

  it('copies a previous set with an explicit 0 kg (bodyweight)', () => {
    expect(newSetDefaults({ previousSet: { weight: 0, reps: 12 }, lastWeight: null, plannedReps: null })).toEqual({
      weight: 0,
      reps: 12,
    })
  })

  it('falls back to the "Anterior" weight and the planned lower bound for reps', () => {
    expect(newSetDefaults({ previousSet: null, lastWeight: 50, plannedReps: '8-10' })).toEqual({ weight: 50, reps: 8 })
  })

  it('leaves the weight empty (null) when nothing is known', () => {
    expect(newSetDefaults({ previousSet: null, lastWeight: null, plannedReps: '12' })).toEqual({ weight: null, reps: 12 })
  })

  it('uses the fallback reps without a plan', () => {
    expect(newSetDefaults({ previousSet: null, lastWeight: null, plannedReps: null })).toEqual({
      weight: null,
      reps: FALLBACK_REPS,
    })
  })
})

describe('parseWeightInput', () => {
  it('returns null for an empty or blank input', () => {
    expect(parseWeightInput('')).toBeNull()
    expect(parseWeightInput('  ')).toBeNull()
  })

  it('accepts an explicit 0 and decimals', () => {
    expect(parseWeightInput('0')).toBe(0)
    expect(parseWeightInput('22.5')).toBe(22.5)
  })

  it('rejects negative or non-numeric input', () => {
    expect(parseWeightInput('-5')).toBeNull()
    expect(parseWeightInput('abc')).toBeNull()
  })
})
