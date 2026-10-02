import { describe, expect, it } from 'vitest'
import { groupRoutinesByDay } from './group-routines-by-day'

const routine = (id: string, dayOfWeek: number | null) => ({ id, day_of_week: dayOfWeek })

describe('groupRoutinesByDay', () => {
  it('always returns all 7 days Monday through Sunday, in order', () => {
    const groups = groupRoutinesByDay([])

    expect(groups.map((group) => group.day)).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ])
    expect(groups.every((group) => group.routines.length === 0)).toBe(true)
  })

  it('places each routine under its day_of_week', () => {
    const groups = groupRoutinesByDay([routine('1', 2), routine('2', 0), routine('3', 4)])

    expect(groups[0]).toEqual({ day: 'Lunes', routines: [routine('2', 0)] })
    expect(groups[2]).toEqual({ day: 'Miércoles', routines: [routine('1', 2)] })
    expect(groups[4]).toEqual({ day: 'Viernes', routines: [routine('3', 4)] })
  })

  it('leaves a day with no matching routine as an empty group (rest day)', () => {
    const groups = groupRoutinesByDay([routine('1', 0)])

    expect(groups[3]).toEqual({ day: 'Jueves', routines: [] })
  })

  it('groups multiple routines on the same day, preserving input order', () => {
    const groups = groupRoutinesByDay([routine('1', 0), routine('2', 1), routine('3', 0)])

    expect(groups[0].routines.map((r) => r.id)).toEqual(['1', '3'])
  })

  it('puts routines with no day assigned into a trailing group', () => {
    const groups = groupRoutinesByDay([routine('1', null), routine('2', 0)])

    expect(groups).toHaveLength(8)
    expect(groups[7]).toEqual({ day: 'Sin día asignado', routines: [routine('1', null)] })
  })

  it('omits the trailing unassigned group when every routine has a day', () => {
    const groups = groupRoutinesByDay([routine('1', 0)])

    expect(groups).toHaveLength(7)
  })
})
