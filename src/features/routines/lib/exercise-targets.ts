// Validation for a routine exercise's planned targets (the "Agregar
// ejercicio" config sheet in `routine-form-page.tsx`). Inputs are the raw
// form strings; a valid result carries the values ready for the draft.

export const DEFAULT_TARGET_SETS = '3'
export const DEFAULT_TARGET_REPS = '8-10'

const MIN_SETS = 1
const MAX_SETS = 20

const SETS_ERROR = `Series: un número entero entre ${MIN_SETS} y ${MAX_SETS}`
const REPS_ERROR = 'Indicá las reps objetivo'

export type ExerciseTargetsValidation =
  | { ok: true; targetSets: number; targetReps: string }
  | { ok: false; setsError: string | null; repsError: string | null }

export function validateExerciseTargets(sets: string, reps: string): ExerciseTargetsValidation {
  const trimmedSets = sets.trim()
  const parsedSets = Number(trimmedSets)
  const setsValid =
    /^\d+$/.test(trimmedSets) && Number.isInteger(parsedSets) && parsedSets >= MIN_SETS && parsedSets <= MAX_SETS
  const trimmedReps = reps.trim()
  const repsValid = trimmedReps.length > 0

  if (setsValid && repsValid) return { ok: true, targetSets: parsedSets, targetReps: trimmedReps }
  return { ok: false, setsError: setsValid ? null : SETS_ERROR, repsError: repsValid ? null : REPS_ERROR }
}
