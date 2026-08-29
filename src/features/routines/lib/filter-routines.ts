// Client-side search filter for `/routines` — the "Buscar" button (previously
// unwired, no `onClick`) filters the already-loaded routine list by name.
// Pure and side-effect-free so it's independently unit-testable, following
// this codebase's convention for small transformation logic (e.g.
// `days-since.ts`, `routine-summary.ts`).
export function filterRoutinesByName<T extends { name: string }>(routines: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return routines
  return routines.filter((routine) => routine.name.toLowerCase().includes(normalized))
}
