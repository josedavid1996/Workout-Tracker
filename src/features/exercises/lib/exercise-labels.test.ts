import { describe, expect, it } from 'vitest'
import { bodyPartLabel, equipmentLabel, muscleLabel } from './exercise-labels'

const LIVE_BODY_PARTS = [
  'upper arms',
  'back',
  'chest',
  'shoulders',
  'upper legs',
  'lower legs',
  'lower arms',
  'cardio',
  'neck',
  'waist',
]

const LIVE_EQUIPMENT = [
  'dumbbell',
  'body weight',
  'cable',
  'barbell',
  'leverage machine',
  'band',
  'kettlebell',
  'ez barbell',
  'stability ball',
  'assisted',
  'rope',
  'sled machine',
  'upper body ergometer',
  'medicine ball',
]

const LIVE_MUSCLES = [
  // `target`
  'biceps',
  'delts',
  'pectorals',
  'triceps',
  'abs',
  'glutes',
  'upper back',
  'lats',
  'calves',
  'forearms',
  'quads',
  'hamstrings',
  'traps',
  'spine',
  'cardiovascular system',
  'adductors',
  'serratus anterior',
  'abductors',
  // `muscle_group`
  'quadriceps',
  'shoulders',
  'obliques',
  'hip flexors',
  'chest',
  'deltoids',
  'ankles',
  'core',
  'lower back',
  'rotator cuff',
  'rhomboids',
  'latissimus dorsi',
  'abdominals',
  'hands',
  'ankle stabilizers',
]

describe('bodyPartLabel', () => {
  it('translates body parts to Spanish', () => {
    expect(bodyPartLabel('back')).toBe('Espalda')
    expect(bodyPartLabel('chest')).toBe('Pecho')
    expect(bodyPartLabel('upper arms')).toBe('Brazos')
    expect(bodyPartLabel('lower legs')).toBe('Pantorrillas')
  })

  it('is case-insensitive and ignores surrounding whitespace', () => {
    expect(bodyPartLabel('Upper Arms')).toBe('Brazos')
    expect(bodyPartLabel('  CHEST ')).toBe('Pecho')
  })

  it.each(LIVE_BODY_PARTS)('has a translation for live value "%s"', (value) => {
    expect(bodyPartLabel(value)).not.toBe(value)
  })
})

describe('equipmentLabel', () => {
  it('translates equipment to Spanish', () => {
    expect(equipmentLabel('dumbbell')).toBe('Mancuerna')
    expect(equipmentLabel('ez barbell')).toBe('Barra EZ')
    expect(equipmentLabel('body weight')).toBe('Peso corporal')
    expect(equipmentLabel('cable')).toBe('Polea')
  })

  it.each(LIVE_EQUIPMENT)('has a translation for live value "%s"', (value) => {
    expect(equipmentLabel(value)).not.toBe(value)
  })
})

describe('muscleLabel', () => {
  it('translates muscles to Spanish', () => {
    expect(muscleLabel('delts')).toBe('Deltoides')
    expect(muscleLabel('lats')).toBe('Dorsales')
    expect(muscleLabel('hamstrings')).toBe('Isquiotibiales')
    expect(muscleLabel('lower back')).toBe('Zona lumbar')
  })

  it('covers common secondary muscles', () => {
    expect(muscleLabel('brachialis')).toBe('Braquial')
    expect(muscleLabel('wrist flexors')).toBe('Flexores de muñeca')
  })

  it.each(LIVE_MUSCLES)('has a translation for live value "%s"', (value) => {
    expect(muscleLabel(value)).not.toBe(value)
  })
})

describe('fallbacks', () => {
  it('returns the raw value for unknown terms', () => {
    expect(bodyPartLabel('tail')).toBe('tail')
    expect(equipmentLabel('hover board')).toBe('hover board')
    expect(muscleLabel('Mystery Muscle')).toBe('Mystery Muscle')
  })

  it('returns an empty string for null, undefined or empty input', () => {
    expect(bodyPartLabel(null)).toBe('')
    expect(equipmentLabel(undefined)).toBe('')
    expect(muscleLabel('')).toBe('')
  })
})
