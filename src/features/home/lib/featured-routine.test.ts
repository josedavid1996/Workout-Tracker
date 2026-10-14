import { describe, expect, it } from 'vitest'
import { pickFeaturedRoutine, todayDayOfWeek } from './featured-routine'

const routines = [
  { id: 'newest', day_of_week: null },
  { id: 'wednesday', day_of_week: 2 },
  { id: 'monday', day_of_week: 0 },
]

describe('todayDayOfWeek', () => {
  it('maps a JS date to the 0=Monday..6=Sunday convention of routines.day_of_week', () => {
    expect(todayDayOfWeek(new Date(2026, 9, 12))).toBe(0) // Monday
    expect(todayDayOfWeek(new Date(2026, 9, 14))).toBe(2) // Wednesday
    expect(todayDayOfWeek(new Date(2026, 9, 18))).toBe(6) // Sunday
  })
})

describe('pickFeaturedRoutine', () => {
  it('prefers the routine assigned to today over the last used one', () => {
    expect(pickFeaturedRoutine({ routines, lastUsedRoutineId: 'monday', dayOfWeek: 2 })).toEqual({
      routine: routines[1],
      reason: 'today',
    })
  })

  it('falls back to the last used routine when nothing is assigned to today', () => {
    expect(pickFeaturedRoutine({ routines, lastUsedRoutineId: 'monday', dayOfWeek: 4 })).toEqual({
      routine: routines[2],
      reason: 'recent',
    })
  })

  it('falls back to the first listed routine when the last used one is gone or there is none', () => {
    expect(pickFeaturedRoutine({ routines, lastUsedRoutineId: 'deleted', dayOfWeek: 4 })).toEqual({
      routine: routines[0],
      reason: 'newest',
    })
    expect(pickFeaturedRoutine({ routines, lastUsedRoutineId: null, dayOfWeek: 4 })).toEqual({
      routine: routines[0],
      reason: 'newest',
    })
  })

  it('returns null with no routines', () => {
    expect(pickFeaturedRoutine({ routines: [], lastUsedRoutineId: null, dayOfWeek: 0 })).toBeNull()
  })
})
