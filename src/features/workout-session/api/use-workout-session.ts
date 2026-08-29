import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SetTag } from '../../../shared/lib/countable-set'
import type { LogSetParams, SetPatch } from './workout-session'
import {
  addWorkoutExercise,
  fetchRoutineTargets,
  fetchWorkout,
  finishWorkout,
  getLastLoggedWeight,
  getUserEquipment,
  logSet,
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

export function useUserEquipmentQuery() {
  return useQuery({ queryKey: workoutQueryKeys.equipment, queryFn: getUserEquipment })
}

export function useStartWorkoutMutation() {
  return useMutation({
    mutationFn: (routineId: string | null) => startWorkout(routineId),
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

// Re-exported so pages don't need to import `SetTag` from two places.
export type { SetTag }
