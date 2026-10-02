import { describe, expect, it } from 'vitest'
import { DEFAULT_TARGET_REPS, DEFAULT_TARGET_SETS, validateExerciseTargets } from './exercise-targets'

describe('validateExerciseTargets', () => {
  it('exposes the form defaults (3 × 8-10)', () => {
    expect(DEFAULT_TARGET_SETS).toBe('3')
    expect(DEFAULT_TARGET_REPS).toBe('8-10')
  })

  it('accepts the defaults and returns parsed values', () => {
    expect(validateExerciseTargets('3', '8-10')).toEqual({ ok: true, targetSets: 3, targetReps: '8-10' })
  })

  it('trims reps and sets', () => {
    expect(validateExerciseTargets(' 4 ', ' 12 ')).toEqual({ ok: true, targetSets: 4, targetReps: '12' })
  })

  it('accepts the 1 and 20 bounds', () => {
    expect(validateExerciseTargets('1', '5').ok).toBe(true)
    expect(validateExerciseTargets('20', '5').ok).toBe(true)
  })

  it('rejects empty, zero, negative, out-of-range or non-integer sets', () => {
    for (const sets of ['', '0', '-1', '21', '2.5', 'abc']) {
      expect(validateExerciseTargets(sets, '8-10')).toEqual({
        ok: false,
        setsError: 'Series: un número entero entre 1 y 20',
        repsError: null,
      })
    }
  })

  it('rejects empty or whitespace-only reps', () => {
    expect(validateExerciseTargets('3', '   ')).toEqual({ ok: false, setsError: null, repsError: 'Indicá las reps objetivo' })
  })

  it('reports both errors at once', () => {
    expect(validateExerciseTargets('', '')).toEqual({
      ok: false,
      setsError: 'Series: un número entero entre 1 y 20',
      repsError: 'Indicá las reps objetivo',
    })
  })
})
