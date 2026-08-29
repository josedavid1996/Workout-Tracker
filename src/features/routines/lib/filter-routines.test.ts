import { describe, expect, it } from 'vitest'
import { filterRoutinesByName } from './filter-routines'

const routines = [
  { name: 'Push Day' },
  { name: 'Pull Day' },
  { name: 'Leg Day' },
]

describe('filterRoutinesByName', () => {
  it('returns all routines when the query is empty', () => {
    expect(filterRoutinesByName(routines, '')).toEqual(routines)
  })

  it('returns all routines when the query is only whitespace', () => {
    expect(filterRoutinesByName(routines, '   ')).toEqual(routines)
  })

  it('matches case-insensitively by substring', () => {
    expect(filterRoutinesByName(routines, 'push')).toEqual([{ name: 'Push Day' }])
    expect(filterRoutinesByName(routines, 'DAY')).toEqual(routines)
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterRoutinesByName(routines, 'cardio')).toEqual([])
  })

  it('ignores leading/trailing whitespace in the query', () => {
    expect(filterRoutinesByName(routines, '  pull  ')).toEqual([{ name: 'Pull Day' }])
  })
})
