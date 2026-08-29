import { useNavigate } from 'react-router-dom'
import type { Exercise } from '../api/exercises'
import { useExerciseQuery } from '../api/use-exercises'
import { equipmentCategoryLabel, equipmentToCategory } from '../lib/equipment-category'
import { EQUIPMENT_CATEGORY_ICONS } from '../lib/equipment-icons'
import { getSpanishInstructionSteps } from '../lib/get-spanish-instruction-steps'
import { Sheet } from '../../../shared/ui/sheet'
import { Chip } from '../../../shared/ui/chip'
import { Button } from '../../../shared/ui/button'

interface QuickReferenceSheetProps {
  // Fetched internally via `useExerciseQuery` when `exercise` is not given —
  // this is what makes the sheet usable from callers that only ever have an
  // id at hand (e.g. `exercise-picker.tsx`'s result rows, which mount one
  // sheet per row but only fetch when actually opened).
  exerciseId: string
  // Optional escape hatch for callers that already have the full `Exercise`
  // loaded (e.g. `workout-session-page.tsx`'s `CurrentExercisePanel`, which
  // already resolves `exerciseInfo` via `useExercisesByIdsQuery` for its own
  // header) — passing it avoids a redundant fetch for the same row/id.
  exercise?: Exercise
  open: boolean
  onClose: () => void
}

// Bottom sheet for "Fase 3 · Quick Reference" (Figma node `16:1626`):
// target/secondary muscles, equipment, and Spanish instruction steps for one
// exercise, without leaving the current screen (exercise picker or active
// session). Deliberately text/chip-only — no anatomical body-silhouette
// highlighting (would need new per-muscle-group artwork that doesn't exist
// and isn't proportional to a personal-use app's scope, see PR10 plan).
export function QuickReferenceSheet({ exerciseId, exercise: exerciseProp, open, onClose }: QuickReferenceSheetProps) {
  const navigate = useNavigate()
  const shouldFetch = open && !exerciseProp
  const exerciseQuery = useExerciseQuery(shouldFetch ? exerciseId : undefined)
  const exercise = exerciseProp ?? exerciseQuery.data

  if (!open) return null

  const isLoading = !exercise && shouldFetch && exerciseQuery.isLoading

  const handleViewDetail = () => {
    onClose()
    navigate(`/exercises/${exerciseId}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title={exercise?.name ?? 'Ejercicio'}>
      {isLoading && <p className="text-sm text-muted">Cargando…</p>}

      {!isLoading && !exercise && <p className="text-sm text-muted">No se encontró el ejercicio.</p>}

      {exercise && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5">
            <Chip icon={<img src={EQUIPMENT_CATEGORY_ICONS[equipmentToCategory(exercise.equipment)]} alt="" className="h-3.5 w-3.5" />}>
              {equipmentCategoryLabel(equipmentToCategory(exercise.equipment))}
            </Chip>
          </div>

          {(exercise.target || (exercise.secondary_muscles && exercise.secondary_muscles.length > 0)) && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">Músculos</span>
              <div className="flex flex-wrap gap-1.5">
                {exercise.target && <Chip active>{exercise.target}</Chip>}
                {(exercise.secondary_muscles ?? []).map((muscle) => (
                  <Chip key={muscle}>{muscle}</Chip>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">Instrucciones</span>
            {(() => {
              const steps = getSpanishInstructionSteps(exercise)
              if (steps.length === 0) {
                return <p className="text-sm text-muted">Instrucciones no disponibles en español</p>
              }
              return (
                <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-foreground">
                  {steps.map((step, index) => (
                    // eslint-disable-next-line react/no-array-index-key -- steps are an ordered, unkeyed string list from the catalog
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )
            })()}
          </div>

          <Button type="button" variant="secondary" onClick={handleViewDetail}>
            Ver detalle completo
          </Button>
        </div>
      )}
    </Sheet>
  )
}
