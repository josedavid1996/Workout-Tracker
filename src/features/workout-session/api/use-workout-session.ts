import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SetTag } from '../../../shared/lib/countable-set'
import type { LogSetParams, ReplaceWorkoutExerciseParams, SetPatch } from './workout-session'
import {
  addWorkoutExercise,
  deleteSet,
  discardWorkout,
  fetchRoutineTargets,
  fetchWorkout,
  finishWorkout,
  getLastLoggedWeight,
  getPreviousSessionSets,
  getUserEquipment,
  logSet,
  removeWorkoutExercise,
  replaceWorkoutExercise,
  resumeActiveWorkout,
  startWorkout,
  toggleCompleted,
  updateSet,
} from './workout-session'

// Thin React Query wiring over `./workout-session.ts` — no branching logic
// of its own beyond cache keys/invalidation, mirroring
// `features/routines/api/use-routines.ts`.
export const workoutQueryKeys = {
  active: ['workouts', 'active'] as const,
  detail: (id: string) => ['workouts', id] as const,
  routineTargets: (routineId: string) => ['routine-targets', routineId] as const,
  lastWeight: (exerciseId: string, excludeWorkoutId: string) =>
    ['workouts', 'last-weight', exerciseId, excludeWorkoutId] as const,
  previousSets: (exerciseId: string, excludeWorkoutId: string) =>
    ['workouts', 'previous-sets', exerciseId, excludeWorkoutId] as const,
  equipment: ['user-equipment'] as const,
}

export function useActiveWorkoutQuery() {
  return useQuery({ queryKey: workoutQueryKeys.active, queryFn: resumeActiveWorkout })
}

export function useWorkoutQuery(id: string | undefined) {
  return useQuery({
    queryKey: workoutQueryKeys.detail(id ?? ''),
    queryFn: () => fetchWorkout(id as string),
    enabled: !!id,
  })
}

export function useRoutineTargetsQuery(routineId: string | null | undefined) {
  return useQuery({
    queryKey: workoutQueryKeys.routineTargets(routineId ?? ''),
    queryFn: () => fetchRoutineTargets(routineId as string),
    enabled: !!routineId,
  })
}

export function useLastLoggedWeightQuery(exerciseId: string, excludeWorkoutId: string) {
  return useQuery({
    queryKey: workoutQueryKeys.lastWeight(exerciseId, excludeWorkoutId),
    queryFn: () => getLastLoggedWeight(exerciseId, excludeWorkoutId),
  })
}

export function usePreviousSessionSetsQuery(exerciseId: string, excludeWorkoutId: string) {
  return useQuery({
    queryKey: workoutQueryKeys.previousSets(exerciseId, excludeWorkoutId),
    queryFn: () => getPreviousSessionSets(exerciseId, excludeWorkoutId),
  })
}

export function useUserEquipmentQuery() {
  return useQuery({ queryKey: workoutQueryKeys.equipment, queryFn: getUserEquipment })
}

export function useStartWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (routineId: string | null) => startWorkout(routineId),
    // Screens that offer "start" (home, start page) also read the active
    // workout to offer "continue" instead.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.active })
    },
  })
}

export function useAddWorkoutExerciseMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ exerciseId, position }: { exerciseId: string; position: number }) =>
      addWorkoutExercise(workoutId, exerciseId, position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useRemoveWorkoutExerciseMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutExerciseId: string) => removeWorkoutExercise(workoutExerciseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useReplaceWorkoutExerciseMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Omit<ReplaceWorkoutExerciseParams, 'workoutId'>) =>
      replaceWorkoutExercise({ ...params, workoutId }),
    // Also on error: a swap is several writes, so a failure can leave some
    // of them applied — refetch to show what is really stored.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useDeleteSetMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useDiscardWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => discardWorkout(workoutId),
    onSuccess: (_data, workoutId) => {
      queryClient.removeQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.active })
    },
  })
}

export function useLogSetMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: LogSetParams) => logSet(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useUpdateSetMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SetPatch }) => updateSet(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useToggleCompletedMutation(workoutId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => toggleCompleted(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
    },
  })
}

export function useFinishWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => finishWorkout(workoutId),
    onSuccess: (_data, workoutId) => {
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.detail(workoutId) })
      queryClient.invalidateQueries({ queryKey: workoutQueryKeys.active })
    },
  })
}

// After editing a FINISHED workout every derived view (history, stats,
// records, charts) may have changed, so all cached queries are marked stale.
export function useRefreshAllQueries() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries()
  }
}

// Re-exported so pages don't need to import `SetTag` from two places.
export type { SetTag }
