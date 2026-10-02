import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { Exercise, ExerciseFilters } from './exercises'
import {
  fetchExerciseById,
  fetchExerciseFocus,
  fetchExercisesByIds,
  fetchRelatedExercises,
  fetchSimilarExercises,
  searchExercises,
} from './exercises'

// Thin React Query wiring over `./exercises.ts` — no branching logic of its
// own beyond cache keys, so it is not unit-tested separately from the
// (tested) functions it wraps. Mirrors `features/routines/api/use-routines.ts`.
export const exercisesQueryKeys = {
  search: (filters: ExerciseFilters) => ['exercises', 'search', filters] as const,
  related: (target: string, excludeId: string) => ['exercises', 'related', target, excludeId] as const,
  detail: (id: string) => ['exercises', id] as const,
  byIds: (ids: string[]) => ['exercises', 'byIds', ...[...ids].sort()] as const,
  focus: (id: string) => ['exercises', 'focus', id] as const,
  similar: (id: string) => ['exercises', 'similar', id] as const,
}

// Infinite scroll over the (1300+ row) catalog — each page fetches
// `SEARCH_PAGE_SIZE` rows via `searchExercises`'s `.range()`, and there's a
// next page exactly when the paged query came back full (`hasMore`; page 0
// may carry extra pinned exact-name matches on top).
export function useExerciseSearchQuery(filters: ExerciseFilters) {
  return useInfiniteQuery({
    queryKey: exercisesQueryKeys.search(filters),
    queryFn: ({ pageParam }) => searchExercises(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasMore ? allPages.length : undefined),
  })
}

export function useRelatedExercisesQuery(target: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: exercisesQueryKeys.related(target ?? '', excludeId ?? ''),
    queryFn: () => fetchRelatedExercises(target as string, excludeId as string),
    enabled: Boolean(target) && Boolean(excludeId),
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

// Focus tag (`exercise_focus`, migration 0011) for one exercise — `null`
// when it has none. Errors (e.g. table not yet created) just leave `data`
// undefined, so callers simply hide the tag.
export function useExerciseFocusQuery(id: string | undefined) {
  return useQuery({
    queryKey: exercisesQueryKeys.focus(id ?? ''),
    queryFn: () => fetchExerciseFocus(id as string),
    enabled: !!id,
    // No retries: an error here is expected before migration 0011 is applied.
    retry: false,
  })
}

// Pass `undefined` to keep it idle (e.g. while the Quick Reference sheet is
// closed or its exercise is still loading).
export function useSimilarExercisesQuery(exercise: Exercise | undefined) {
  return useQuery({
    queryKey: exercisesQueryKeys.similar(exercise?.id ?? ''),
    queryFn: () => fetchSimilarExercises(exercise as Exercise),
    enabled: !!exercise,
  })
}
