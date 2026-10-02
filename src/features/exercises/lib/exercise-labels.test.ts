import { describe, expect, it } from 'vitest'
import { bodyPartLabel, equipmentLabel, focusLabel, muscleLabel, primaryMuscleLabel, uniqueMuscleLabels } from './exercise-labels'

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
    expect(muscleLabel('lats')).toBe('Dorsal')
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

  it.each([
    [['traps', 'trapezius'], 'Trapecio'],
    [['delts', 'deltoids', 'shoulders'], 'Deltoides'],
    [['lats', 'latissimus dorsi'], 'Dorsal'],
    [['abs', 'abdominals'], 'Abdominales'],
    [['quads', 'quadriceps'], 'Cuádriceps'],
  ])('maps synonyms %j to the single label "%s"', (synonyms, label) => {
    for (const synonym of synonyms) expect(muscleLabel(synonym)).toBe(label)
  })
})

describe('uniqueMuscleLabels', () => {
  it('translates and dedupes by displayed label, keeping first-seen order', () => {
    expect(uniqueMuscleLabels(['traps', 'biceps', 'trapezius', 'lats', 'latissimus dorsi', 'biceps'])).toEqual([
      'Trapecio',
      'Bíceps',
      'Dorsal',
    ])
  })

  it('skips null, undefined and empty values', () => {
    expect(uniqueMuscleLabels([null, undefined, '', 'quads', 'quadriceps'])).toEqual(['Cuádriceps'])
  })
})

// Every key allowed by `exercise_focus.focus`'s check constraint
// (`supabase/migrations/0011_exercise_focus.sql`).
const FOCUS_KEYS = [
  'adductors',
  'anterior_deltoid',
  'biceps_long_head',
  'biceps_short_head',
  'brachialis',
  'deep_core',
  'forearm_extensors',
  'forearm_flexors',
  'gastrocnemius',
  'gluteus_maximus',
  'gluteus_medius',
  'hamstrings',
  'lateral_deltoid',
  'lats',
  'lower_abs',
  'lower_back',
  'lower_chest',
  'mid_back',
  'mid_chest',
  'neck',
  'obliques',
  'posterior_deltoid',
  'quads_rectus_femoris',
  'quads_vastus',
  'rotator_cuff',
  'soleus',
  'triceps_lateral_head',
  'triceps_long_head',
  'triceps_medial_head',
  'upper_abs',
  'upper_chest',
  'upper_traps',
]

describe('focusLabel', () => {
  it('translates focus keys to Spanish', () => {
    expect(focusLabel('lateral_deltoid')).toBe('Deltoide lateral')
    expect(focusLabel('posterior_deltoid')).toBe('Deltoide posterior')
    expect(focusLabel('anterior_deltoid')).toBe('Deltoide anterior')
    expect(focusLabel('triceps_long_head')).toBe('Tríceps · cabeza larga')
    expect(focusLabel('biceps_short_head')).toBe('Bíceps · cabeza corta')
    expect(focusLabel('brachialis')).toBe('Braquial')
    expect(focusLabel('upper_chest')).toBe('Pectoral superior')
    expect(focusLabel('lats')).toBe('Dorsal')
    expect(focusLabel('mid_back')).toBe('Espalda media')
    expect(focusLabel('gluteus_medius')).toBe('Glúteo medio')
    expect(focusLabel('soleus')).toBe('Sóleo')
    expect(focusLabel('deep_core')).toBe('Core profundo')
    expect(focusLabel('quads_rectus_femoris')).toBe('Cuádriceps · recto femoral')
    expect(focusLabel('quads_vastus')).toBe('Cuádriceps · vastos')
  })

  it('has 32 focus keys, all with a translation', () => {
    expect(FOCUS_KEYS).toHaveLength(32)
  })

  it.each(FOCUS_KEYS)('has a translation for focus key "%s"', (key) => {
    expect(focusLabel(key)).not.toBe(key)
  })

  it('returns the raw value for an unknown key and an empty string for null', () => {
    expect(focusLabel('mystery_head')).toBe('mystery_head')
    expect(focusLabel(null)).toBe('')
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

describe('primaryMuscleLabel', () => {
  it('prefers the focus label when the focus is known', () => {
    expect(primaryMuscleLabel('lateral_deltoid', 'delts')).toBe('Deltoide lateral')
  })

  it('falls back to the target muscle label without a focus', () => {
    expect(primaryMuscleLabel(null, 'traps')).toBe('Trapecio')
    expect(primaryMuscleLabel(undefined, 'lats')).toBe('Dorsal')
  })

  it('returns an empty string when neither is known', () => {
    expect(primaryMuscleLabel(null, null)).toBe('')
  })
})
