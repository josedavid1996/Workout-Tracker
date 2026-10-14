import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import iconBack from '../../../assets/icons/icon-back.svg'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { IconButton } from '../../../shared/ui/icon-button'
import { ExerciseThumbnail } from '../../exercises/components/exercise-thumbnail'
import type { Exercise } from '../../exercises/api/exercises'
import { useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { QuickReferenceSheet } from '../../exercises/components/quick-reference-sheet'
import { equipmentLabel, muscleLabel } from '../../exercises/lib/exercise-labels'
import { useRoutinesWithExercisesQuery } from '../api/use-routines'
import { groupRoutinesByDay } from '../lib/group-routines-by-day'

// Read-only weekly overview meant to be shown to a trainer, in person, on
// the user's own phone (no public link/export — see routines feature
// exploration notes). Groups the user's routines by `day_of_week` and always
// shows all 7 days — a day with no routine renders as "Descanso". Tapping
// an exercise opens its quick reference (photo/animation, muscles,
// instructions) without leaving the week.
export function RoutineWeeklyPreviewPage() {
  const navigate = useNavigate()
  const routinesQuery = useRoutinesWithExercisesQuery()
  // The exercise whose quick reference is open, if any. One sheet for the
  // whole page rather than one per row.
  const [previewExerciseId, setPreviewExerciseId] = useState<string | null>(null)

  const routines = useMemo(() => routinesQuery.data ?? [], [routinesQuery.data])

  const allExerciseIds = useMemo(
    () =>
      Array.from(
        new Set(routines.flatMap((routine) => routine.routine_exercises.map((exercise) => exercise.exercise_id))),
      ),
    [routines],
  )
  const exercisesQuery = useExercisesByIdsQuery(allExerciseIds)
  // Full catalog rows: the list reads name/image/target/equipment (`target`,
  // not the unreliable `muscle_group` column), and the quick reference gets
  // the same row so it doesn't fetch it again.
  const exercisesById = useMemo(
    () => new Map<string, Exercise>((exercisesQuery.data ?? []).map((exercise) => [exercise.id, exercise])),
    [exercisesQuery.data],
  )

  const dayGroups = useMemo(() => groupRoutinesByDay(routines), [routines])

  const isLoading = routinesQuery.isLoading
  const hasNoRoutines = !isLoading && routines.length === 0

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <header className="flex items-center justify-between">
          <IconButton aria-label="Volver" onClick={() => navigate(-1)}>
            <img src={iconBack} alt="" className="h-4 w-4" />
          </IconButton>
          <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
            Semana
          </h1>
          <span aria-hidden="true" className="h-9 w-9" />
        </header>

        {isLoading && <p className="text-muted">Cargando...</p>}
        {routinesQuery.isError && <p className="text-red-400">No se pudo cargar la semana.</p>}

        {hasNoRoutines && (
          <p className="text-sm text-muted">Todavía no creaste ninguna rutina.</p>
        )}

        {dayGroups.map((group) => (
          <section key={group.day} className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">{group.day}</span>

            {group.routines.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                Descanso
              </div>
            )}

            <ul className="flex flex-col gap-3">
              {group.routines.map((routine) => (
                <li
                  key={routine.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4"
                >
                  <span className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                    {routine.name}
                  </span>

                  {routine.routine_exercises.length === 0 && (
                    <p className="text-sm text-muted">Sin ejercicios.</p>
                  )}

                  <ul className="flex flex-col gap-2">
                    {routine.routine_exercises
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((exercise) => {
                        const details = exercisesById.get(exercise.exercise_id)
                        return (
                          <li key={exercise.id}>
                            <button
                              type="button"
                              onClick={() => setPreviewExerciseId(exercise.exercise_id)}
                              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
                            >
                              <ExerciseThumbnail
                                src={details?.image}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-md border border-border bg-surface-2"
                              />
                              <div className="flex flex-1 flex-col">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm text-foreground">
                                    {details?.name ?? exercise.exercise_id}
                                  </span>
                                  <span className="font-mono text-xs text-muted whitespace-nowrap">
                                    {exercise.target_sets ?? '—'} × {exercise.target_reps ?? '—'}
                                  </span>
                                </div>
                                <span className="font-mono text-xs text-muted">
                                  {[muscleLabel(details?.target), equipmentLabel(details?.equipment)].filter(Boolean).join(' · ') || '—'}
                                </span>
                                {exercise.notes && <span className="text-xs text-muted">{exercise.notes}</span>}
                              </div>
                            </button>
                          </li>
                        )
                      })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {previewExerciseId && (
        <QuickReferenceSheet
          exerciseId={previewExerciseId}
          exercise={exercisesById.get(previewExerciseId)}
          open
          onClose={() => setPreviewExerciseId(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
