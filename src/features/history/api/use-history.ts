import { useQuery } from '@tanstack/react-query'
import { fetchHomeStats, fetchWorkoutHistory } from './history'

// Thin React Query wiring over `./history.ts` — no branching logic of its
// own, mirroring `features/routines/api/use-routines.ts`.
export const historyQueryKeys = {
  all: ['workout-history'] as const,
  homeStats: ['workout-history', 'home-stats'] as const,
}

export function useWorkoutHistoryQuery() {
  return useQuery({ queryKey: historyQueryKeys.all, queryFn: fetchWorkoutHistory })
}

export function useHomeStatsQuery() {
  return useQuery({ queryKey: historyQueryKeys.homeStats, queryFn: fetchHomeStats })
}
