import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../../../shared/supabase/client'
import type { PlateInventory } from '../../../shared/lib/plates'

// Same untyped-client cast used across other feature `api/` modules until
// `database.types.ts` is generated — see `features/routines/api/routines.ts`.
const db = supabase as unknown as SupabaseClient

export type UserEquipment = {
  bar_weight: number
  plate_inventory: PlateInventory
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error

  const userId = data.user?.id
  if (!userId) throw new Error('Not authenticated')

  return userId
}

// Canonical `user_equipment` read — `features/workout-session/api/workout-session.ts`
// re-exports this function instead of duplicating it (it existed there first,
// before this feature/PR landed).
//
// `.maybeSingle()` already returns `{ data: null, error: null }` for zero
// rows (no throw, e.g. before the user ever saved equipment settings). The
// extra `error` check below only guards against an unrelated, unexpected
// query failure so callers (like the plate calculator) can still degrade to
// "ramp only" rather than crash.
export async function getUserEquipment(): Promise<UserEquipment | null> {
  const { data, error } = await db.from('user_equipment').select('bar_weight, plate_inventory').maybeSingle()

  if (error) return null
  return (data as UserEquipment | null) ?? null
}

// `user_id` is the table's primary key (0001_core_schema.sql), so a single
// upsert keyed on it covers both "first save" (insert) and "edit" (update).
export async function saveUserEquipment(
  barWeight: number,
  plateInventory: PlateInventory,
): Promise<UserEquipment> {
  const userId = await requireUserId()

  const { data, error } = await db
    .from('user_equipment')
    .upsert(
      { user_id: userId, bar_weight: barWeight, plate_inventory: plateInventory },
      { onConflict: 'user_id' },
    )
    .select('bar_weight, plate_inventory')
    .single()

  if (error) throw error
  return data as UserEquipment
}
