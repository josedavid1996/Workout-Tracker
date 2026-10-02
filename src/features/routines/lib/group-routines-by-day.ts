const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

const UNASSIGNED_LABEL = 'Sin día asignado'

export type RoutineDayGroup<T> = { day: string; routines: T[] }

// Groups by the explicit `day_of_week` column (0=Monday..6=Sunday) instead
// of parsing the routine's free-text `name` — see migration 0009. Always
// returns all 7 days in order, even ones with no routine (rendered as
// "Descanso" by the preview page), plus a trailing group for routines with
// no day assigned, only when that group is non-empty.
export function groupRoutinesByDay<T extends { day_of_week: number | null }>(
  routines: T[],
): RoutineDayGroup<T>[] {
  const byDay = new Map<number, T[]>()
  const unassigned: T[] = []

  for (const routine of routines) {
    if (routine.day_of_week === null) {
      unassigned.push(routine)
      continue
    }

    const existing = byDay.get(routine.day_of_week)
    if (existing) {
      existing.push(routine)
    } else {
      byDay.set(routine.day_of_week, [routine])
    }
  }

  const groups: RoutineDayGroup<T>[] = DAY_LABELS.map((label, index) => ({
    day: label,
    routines: byDay.get(index) ?? [],
  }))

  if (unassigned.length > 0) groups.push({ day: UNASSIGNED_LABEL, routines: unassigned })

  return groups
}
