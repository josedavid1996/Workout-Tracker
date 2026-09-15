import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { ExerciseFilters } from './exercises'
import { SEARCH_PAGE_SIZE, fetchExerciseById, fetchExercisesByIds, fetchRelatedExercises, searchExercises } from './exercises'

// Thin React Query wiring over `./exercises.ts` — no branching logic of its
// own beyond cache keys, so it is not unit-tested separately from the
// (tested) functions it wraps. Mirrors `features/routines/api/use-routines.ts`.
export const exercisesQueryKeys = {
  search: (filters: ExerciseFilters) => ['exercises', 'search', filters] as const,
  related: (muscleGroup: string, excludeId: string) => ['exercises', 'related', muscleGroup, excludeId] as const,
  detail: (id: string) => ['exercises', id] as const,
  byIds: (ids: string[]) => ['exercises', 'byIds', ...[...ids].sort()] as const,
}

// Infinite scroll over the (1300+ row) catalog — each page fetches
// `SEARCH_PAGE_SIZE` rows via `searchExercises`'s `.range()`, and there's a
// next page exactly when the last page came back full.
export function useExerciseSearchQuery(filters: ExerciseFilters) {
  return useInfiniteQuery({
    queryKey: exercisesQueryKeys.search(filters),
    queryFn: ({ pageParam }) => searchExercises(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === SEARCH_PAGE_SIZE ? allPages.length : undefined),
  })
}

export function useRelatedExercisesQuery(muscleGroup: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: exercisesQueryKeys.related(muscleGroup ?? '', excludeId ?? ''),
    queryFn: () => fetchRelatedExercises(muscleGroup as string, excludeId as string),
    enabled: Boolean(muscleGroup) && Boolean(excludeId),
  })
}

export function useExerciseQuery(id: string | undefined) {
  return useQuery({
    queryKey: exercisesQueryKeys.detail(id ?? ''),
    queryFn: () => fetchExerciseById(id as string),
    enabled: !!id,
  })
}

// Backs displaying real exercise names (instead of raw ids) for a finished
// workout's per-exercise breakdown — see `workout-summary-page.tsx`.
export function useExercisesByIdsQuery(ids: string[]) {
  return useQuery({
    queryKey: exercisesQueryKeys.byIds(ids),
    queryFn: () => fetchExercisesByIds(ids),
    enabled: ids.length > 0,
  })
}
