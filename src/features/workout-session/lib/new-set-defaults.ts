// Prefill for a set added with "Agregar set" in the active session.
// Priority: the previous set of the same exercise in this session → the
// "Anterior" (last time) weight + planned reps → planned reps with an EMPTY
// weight (`null`), which the user must fill in before completing the set.

// Used only when there is neither a previous set nor a parseable plan;
// `set_entries` requires `reps > 0`.
export const FALLBACK_REPS = 8

export type NewSetDefaultsInput = {
  previousSet: { weight: number; reps: number } | null
  lastWeight: number | null
  plannedReps: string | null
}

export type NewSetDefaults = { weight: number | null; reps: number }

// "8-10" → 8, "12" → 12; `null` when there is no usable number.
export function parsePlannedRepsLowerBound(plannedReps: string | null): number | null {
  const match = plannedReps?.match(/\d+/)
  if (!match) return null
  const value = Number(match[0])
  return value > 0 ? value : null
}

export function newSetDefaults({ previousSet, lastWeight, plannedReps }: NewSetDefaultsInput): NewSetDefaults {
  if (previousSet) return { weight: previousSet.weight, reps: previousSet.reps }
  return { weight: lastWeight, reps: parsePlannedRepsLowerBound(plannedReps) ?? FALLBACK_REPS }
}

// Weight input → kg. `null` means "no valid value" (empty, negative or not a
// number) — never coerced to 0; an explicit "0" (bodyweight) is allowed.
export function parseWeightInput(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}
