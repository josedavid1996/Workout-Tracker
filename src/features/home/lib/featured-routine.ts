// Which routine the home screen offers to start in one tap.

export type FeaturedReason = 'today' | 'recent' | 'newest'

// `routines.day_of_week` is 0=Monday..6=Sunday (migration 0009); JS
// `Date#getDay()` is 0=Sunday.
export function todayDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7
}

// Priority: the routine assigned to today → the last routine actually used
// → the first one in the list (routines arrive newest-first).
export function pickFeaturedRoutine<T extends { id: string; day_of_week: number | null }>({
  routines,
  lastUsedRoutineId,
  dayOfWeek,
}: {
  routines: T[]
  lastUsedRoutineId: string | null
  dayOfWeek: number
}): { routine: T; reason: FeaturedReason } | null {
  const today = routines.find((routine) => routine.day_of_week === dayOfWeek)
  if (today) return { routine: today, reason: 'today' }

  const recent = routines.find((routine) => routine.id === lastUsedRoutineId)
  if (recent) return { routine: recent, reason: 'recent' }

  return routines[0] ? { routine: routines[0], reason: 'newest' } : null
}
