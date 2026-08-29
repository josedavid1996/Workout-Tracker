import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PlateInventory } from '../../../shared/lib/plates'
import { getUserEquipment, saveUserEquipment } from './equipment'

// Thin React Query wiring over `./equipment.ts` — no branching logic of its
// own, mirroring `features/routines/api/use-routines.ts`.
//
// The query key is the literal same array (`['user-equipment']`) that
// `features/workout-session/api/use-workout-session.ts#useUserEquipmentQuery`
// already uses — React Query matches keys by value, not by which module
// declared them, so saving equipment settings here also invalidates the
// plate calculator's cached equipment without either module importing from
// the other.
export const equipmentQueryKeys = {
  detail: ['user-equipment'] as const,
}

export function useUserEquipmentQuery() {
  return useQuery({ queryKey: equipmentQueryKeys.detail, queryFn: getUserEquipment })
}

export function useSaveUserEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ barWeight, plateInventory }: { barWeight: number; plateInventory: PlateInventory }) =>
      saveUserEquipment(barWeight, plateInventory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentQueryKeys.detail })
    },
  })
}
