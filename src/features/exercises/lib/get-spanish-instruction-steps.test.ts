import { describe, expect, it } from 'vitest'
import { getSpanishInstructionSteps } from './get-spanish-instruction-steps'

// `instructions`/`instruction_steps` share the same per-language-key shape
// (`{ en, es, fr, ... }`), but `instruction_steps` values are arrays of
// steps (not a single paragraph) — confirmed via a real curl against the
// live `exercises` table (see PR10 plan notes). This function must use ONLY
// the `es` key and never silently fall back to another language.
describe('getSpanishInstructionSteps', () => {
  it('returns the es steps when present', () => {
    const exercise = {
      instruction_steps: {
        es: ['Paso 1', 'Paso 2'],
        en: ['Step 1', 'Step 2'],
      },
    }

    expect(getSpanishInstructionSteps(exercise)).toEqual(['Paso 1', 'Paso 2'])
  })

  it('returns an empty array when instruction_steps is undefined', () => {
    expect(getSpanishInstructionSteps({ instruction_steps: undefined })).toEqual([])
  })

  it('returns an empty array when instruction_steps is null', () => {
    expect(getSpanishInstructionSteps({ instruction_steps: null })).toEqual([])
  })

  it('returns an empty array when es is absent but other languages are present', () => {
    const exercise = {
      instruction_steps: {
        en: ['Step 1', 'Step 2'],
        fr: ['Étape 1'],
      },
    }

    expect(getSpanishInstructionSteps(exercise)).toEqual([])
  })

  it('returns an empty array when es is present but empty', () => {
    const exercise = {
      instruction_steps: {
        es: [],
      },
    }

    expect(getSpanishInstructionSteps(exercise)).toEqual([])
  })

  it('returns an empty array when instruction_steps is malformed (not an object)', () => {
    expect(getSpanishInstructionSteps({ instruction_steps: 'not-an-object' })).toEqual([])
  })

  it('returns an empty array when es is present but not an array of strings', () => {
    const exercise = {
      instruction_steps: {
        es: 'not-an-array',
      },
    }

    expect(getSpanishInstructionSteps(exercise)).toEqual([])
  })
})
