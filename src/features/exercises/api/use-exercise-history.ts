import { useQuery } from '@tanstack/react-query'
import { fetchExerciseSetHistory } from './exercise-history'

// Thin React Query wiring over `./exercise-history.ts` — no branching logic
// of its own, mirroring `features/routines/api/use-routines.ts`.
export const exerciseHistoryQueryKeys = {
  detail: (exerciseId: string) => ['exercises', exerciseId, 'history'] as const,
}

export function useExerciseSetHistoryQuery(exerciseId: string | undefined) {
  return useQuery({
    queryKey: exerciseHistoryQueryKeys.detail(exerciseId ?? ''),
    queryFn: () => fetchExerciseSetHistory(exerciseId as string),
    enabled: !!exerciseId,
  })
}
