import { useQuery } from '@tanstack/react-query'
import { fetchHomeStats, fetchMuscleSetsSince, fetchWorkoutHistory } from './history'

// Thin React Query wiring over `./history.ts` — no branching logic of its
// own, mirroring `features/routines/api/use-routines.ts`.
export const historyQueryKeys = {
  all: ['workout-history'] as const,
  homeStats: ['workout-history', 'home-stats'] as const,
  muscleSets: (sinceIso: string) => ['workout-history', 'muscle-sets', sinceIso] as const,
}

export function useWorkoutHistoryQuery() {
  return useQuery({ queryKey: historyQueryKeys.all, queryFn: fetchWorkoutHistory })
}

export function useHomeStatsQuery() {
  return useQuery({ queryKey: historyQueryKeys.homeStats, queryFn: fetchHomeStats })
}

export function useMuscleSetsQuery(sinceIso: string) {
  return useQuery({ queryKey: historyQueryKeys.muscleSets(sinceIso), queryFn: () => fetchMuscleSetsSince(sinceIso) })
}
