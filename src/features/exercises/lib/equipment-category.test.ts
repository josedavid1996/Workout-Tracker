import { describe, expect, it } from 'vitest'
import { equipmentCategoryLabel, equipmentToCategory } from './equipment-category'

// Raw values below were discovered by querying the real `exercises` table's
// distinct `equipment` values against the live Supabase instance (see PR7
// apply-progress) — not guessed.
describe('equipmentToCategory', () => {
  it.each([
    ['dumbbell', 'freeweight'],
    ['barbell', 'freeweight'],
    ['ez barbell', 'freeweight'],
    ['kettlebell', 'freeweight'],
    ['body weight', 'bodyweight'],
    ['assisted', 'machine'],
    ['cable', 'cable'],
    ['leverage machine', 'machine'],
    ['sled machine', 'machine'],
    ['band', 'accessory'],
    ['stability ball', 'accessory'],
    ['rope', 'accessory'],
    ['medicine ball', 'accessory'],
    ['upper body ergometer', 'cardio'],
  ] as const)('maps raw value %s to category %s', (raw, expected) => {
    expect(equipmentToCategory(raw)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(equipmentToCategory('Dumbbell')).toBe('freeweight')
    expect(equipmentToCategory('BARBELL')).toBe('freeweight')
  })

  it('defaults unknown raw values to accessory instead of throwing', () => {
    expect(equipmentToCategory('some future equipment')).toBe('accessory')
  })

  it('defaults null/undefined to accessory', () => {
    expect(equipmentToCategory(null)).toBe('accessory')
    expect(equipmentToCategory(undefined)).toBe('accessory')
  })
})

describe('equipmentCategoryLabel', () => {
  it('returns a human label for every category', () => {
    expect(equipmentCategoryLabel('freeweight')).toBe('Peso libre')
    expect(equipmentCategoryLabel('machine')).toBe('Máquina')
    expect(equipmentCategoryLabel('cable')).toBe('Cable')
    expect(equipmentCategoryLabel('bodyweight')).toBe('Peso corporal')
    expect(equipmentCategoryLabel('cardio')).toBe('Cardio')
    expect(equipmentCategoryLabel('accessory')).toBe('Accesorio')
  })
})
