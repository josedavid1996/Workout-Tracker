// Pure ranking for the Quick Reference sheet's "Ejercicios similares":
// exercises tagged with the same `exercise_focus.focus` come first (only
// high/medium confidence, and only when stretch-vs-strength matches the
// current exercise), then the list is topped up with same-`target`
// exercises. Within each tier, picks are diversified by `equipment`.
// Generic over the exercise shape so this module stays free of the `api/`
// layer.

export type FocusConfidence = 'high' | 'medium' | 'low'

export type FocusCandidate<T extends { id: string; equipment?: string | null }> = {
  exercise: T
  focus: string
  confidence: FocusConfidence
  is_stretch: boolean
}

export type SimilarExercise<T extends { id: string }> = {
  exercise: T
  // Known only for same-focus picks; same-target fills carry `null`.
  focus: string | null
}

export type PickSimilarExercisesInput<T extends { id: string; equipment?: string | null }> = {
  currentId: string
  // `null` when the current exercise has no focus row — only same-target
  // candidates are then considered.
  currentFocus: { is_stretch: boolean } | null
  focusCandidates: FocusCandidate<T>[]
  targetCandidates: T[]
  limit?: number
}

export const DEFAULT_SIMILAR_LIMIT = 3

type Diversifiable = { id: string; equipment?: string | null }

export function pickSimilarExercises<T extends Diversifiable>({
  currentId,
  currentFocus,
  focusCandidates,
  targetCandidates,
  limit = DEFAULT_SIMILAR_LIMIT,
}: PickSimilarExercisesInput<T>): SimilarExercise<T>[] {
  const result: SimilarExercise<T>[] = []
  const seen = new Set<string>([currentId])
  // How many picks (across both tiers) use each equipment value.
  const pickedPerEquipment = new Map<string | null, number>()

  // Picks from one tier, round-robin by equipment: each step takes the
  // earliest remaining candidate whose equipment has been picked the fewest
  // times so far (so far = earlier tiers too). Input order is kept within
  // an equipment value. Without this, the alphabetical candidate lists let
  // one equipment (usually barbell variants) fill the whole list.
  const pickTier = (tier: SimilarExercise<T>[]) => {
    const remaining = tier.filter(({ exercise }) => {
      if (seen.has(exercise.id)) return false
      seen.add(exercise.id)
      return true
    })

    while (result.length < limit && remaining.length > 0) {
      let bestIndex = 0
      let bestCount = Number.POSITIVE_INFINITY
      remaining.forEach(({ exercise }, index) => {
        const count = pickedPerEquipment.get(exercise.equipment ?? null) ?? 0
        if (count < bestCount) {
          bestCount = count
          bestIndex = index
        }
      })

      const [picked] = remaining.splice(bestIndex, 1)
      const equipment = picked.exercise.equipment ?? null
      pickedPerEquipment.set(equipment, (pickedPerEquipment.get(equipment) ?? 0) + 1)
      result.push(picked)
    }
  }

  if (currentFocus) {
    pickTier(
      focusCandidates
        .filter((candidate) => candidate.confidence !== 'low' && candidate.is_stretch === currentFocus.is_stretch)
        .map((candidate) => ({ exercise: candidate.exercise, focus: candidate.focus })),
    )
  }

  pickTier(targetCandidates.map((exercise) => ({ exercise, focus: null })))

  return result
}
