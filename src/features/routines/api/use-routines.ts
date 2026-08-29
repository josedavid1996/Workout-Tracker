import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RoutineExerciseDraft } from './routine-exercises-payload'
import {
  createRoutine,
  deleteRoutine,
  fetchRoutine,
  fetchRoutines,
  fetchRoutinesWithExercises,
  updateRoutine,
} from './routines'

// Thin React Query wiring over `./routines.ts` — no branching logic of its
// own beyond cache keys/invalidation, so it is not unit-tested separately
// from the (tested) functions it wraps.
export const routinesQueryKeys = {
  all: ['routines'] as const,
  withExercises: ['routines', 'with-exercises'] as const,
  detail: (id: string) => ['routines', id] as const,
}

export function useRoutinesQuery() {
  return useQuery({ queryKey: routinesQueryKeys.all, queryFn: fetchRoutines })
}

// Backs `/routines`' real card layout (exercise count/names, dominant body
// part) and Home's "hoy toca" fallback — both need each routine's exercises,
// not just id/name/created_at.
export function useRoutinesWithExercisesQuery() {
  return useQuery({ queryKey: routinesQueryKeys.withExercises, queryFn: fetchRoutinesWithExercises })
}

export function useRoutineQuery(id: string | undefined) {
  return useQuery({
    queryKey: routinesQueryKeys.detail(id ?? ''),
    queryFn: () => fetchRoutine(id as string),
    enabled: !!id,
  })
}

export function useCreateRoutineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, exercises }: { name: string; exercises: RoutineExerciseDraft[] }) =>
      createRoutine(name, exercises),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.withExercises })
    },
  })
}

export function useUpdateRoutineMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, exercises }: { name: string; exercises: RoutineExerciseDraft[] }) =>
      updateRoutine(id, name, exercises),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.withExercises })
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.detail(id) })
    },
  })
}

export function useDeleteRoutineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: routinesQueryKeys.withExercises })
    },
  })
}
