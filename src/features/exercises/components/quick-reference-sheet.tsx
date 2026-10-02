import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Exercise } from '../api/exercises'
import { useExerciseFocusQuery, useExerciseQuery, useSimilarExercisesQuery } from '../api/use-exercises'
import { equipmentCategoryLabel, equipmentToCategory } from '../lib/equipment-category'
import { EQUIPMENT_CATEGORY_ICONS } from '../lib/equipment-icons'
import { focusLabel, muscleLabel, uniqueMuscleLabels } from '../lib/exercise-labels'
import { getSpanishInstructionSteps } from '../lib/get-spanish-instruction-steps'
import { Sheet } from '../../../shared/ui/sheet'
import { Chip } from '../../../shared/ui/chip'
import { Button } from '../../../shared/ui/button'
import { ExerciseThumbnail } from './exercise-thumbnail'

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
  // Set when the sheet is opened from a screen holding unsaved state (the
  // exercise picker inside the routine form / session): tapping a similar
  // exercise swaps the sheet content in place (with "← Volver" back to the
  // previous one) instead of navigating away, and "Ver detalle completo"
  // is hidden. Without it (e.g. the active session page, which persists on
  // reload) both navigate to `/exercises/:id`.
  inline?: boolean
}

// Bottom sheet for "Fase 3 · Quick Reference" (Figma node `16:1626`):
// target/secondary muscles, equipment, and Spanish instruction steps for one
// exercise, without leaving the current screen (exercise picker or active
// session). Deliberately text/chip-only — no anatomical body-silhouette
// highlighting (would need new per-muscle-group artwork that doesn't exist
// and isn't proportional to a personal-use app's scope, see PR10 plan).
export function QuickReferenceSheet({
  exerciseId,
  exercise: exerciseProp,
  open,
  onClose,
  inline = false,
}: QuickReferenceSheetProps) {
  const navigate = useNavigate()
  // Inline mode only: similar exercises opened in place, most recent last.
  const [openedSimilar, setOpenedSimilar] = useState<Exercise[]>([])
  const shouldFetch = open && !exerciseProp
  const exerciseQuery = useExerciseQuery(shouldFetch ? exerciseId : undefined)
  const exercise = openedSimilar.at(-1) ?? exerciseProp ?? exerciseQuery.data
  // Both only fetch while the sheet is open (and once the exercise is known).
  const focusQuery = useExerciseFocusQuery(open ? exercise?.id : undefined)
  const similarQuery = useSimilarExercisesQuery(open ? (exercise ?? undefined) : undefined)
  const focus = focusQuery.data?.focus
  const similar = similarQuery.data ?? []

  if (!open) return null

  const isLoading = !exercise && shouldFetch && exerciseQuery.isLoading

  const handleClose = () => {
    setOpenedSimilar([])
    onClose()
  }

  const handleViewDetail = () => {
    handleClose()
    navigate(`/exercises/${exerciseId}`)
  }

  const handleOpenSimilar = (item: Exercise) => {
    if (inline) {
      setOpenedSimilar((current) => [...current, item])
      return
    }
    handleClose()
    navigate(`/exercises/${item.id}`)
  }

  const handleBack = () => setOpenedSimilar((current) => current.slice(0, -1))

  return (
    <Sheet open={open} onClose={handleClose} title={exercise?.name ?? 'Ejercicio'}>
      {isLoading && <p className="text-sm text-muted">Cargando…</p>}

      {!isLoading && !exercise && <p className="text-sm text-muted">No se encontró el ejercicio.</p>}

      {exercise && (
        <div className="flex flex-col gap-4">
          {openedSimilar.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="self-start">
              ← Volver
            </Button>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Chip icon={<img src={EQUIPMENT_CATEGORY_ICONS[equipmentToCategory(exercise.equipment)]} alt="" className="h-3.5 w-3.5" />}>
              {equipmentCategoryLabel(equipmentToCategory(exercise.equipment))}
            </Chip>
            {focus && <Chip active>{focusLabel(focus)}</Chip>}
          </div>

          {(exercise.gif_url || exercise.image) && (
            <img
              src={exercise.gif_url ?? exercise.image ?? undefined}
              alt={exercise.name}
              className="max-h-64 w-full rounded-lg border border-border bg-surface-2 object-contain"
              loading="lazy"
            />
          )}

          {(exercise.target || (exercise.secondary_muscles && exercise.secondary_muscles.length > 0)) && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">Músculos</span>
              <div className="flex flex-wrap gap-1.5">
                {/* Deduped by displayed label: synonyms (e.g. `traps` target +
                    `trapezius` secondary) render as one chip. */}
                {uniqueMuscleLabels([exercise.target, ...(exercise.secondary_muscles ?? [])]).map((label) => (
                  <Chip key={label} active={label === muscleLabel(exercise.target)}>
                    {label}
                  </Chip>
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

          {similar.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wide text-muted">Ejercicios similares</span>
              <ul className="flex flex-col gap-1">
                {similar.map(({ exercise: item, focus: itemFocus }) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenSimilar(item)}
                      className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2"
                    >
                      <ExerciseThumbnail
                        src={item.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-md border border-border bg-surface-2"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-foreground">{item.name}</span>
                        <span className="truncate text-xs text-muted">
                          {itemFocus ? focusLabel(itemFocus) : muscleLabel(item.target)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!inline && (
            <Button type="button" variant="secondary" onClick={handleViewDetail}>
              Ver detalle completo
            </Button>
          )}
        </div>
      )}
    </Sheet>
  )
}
