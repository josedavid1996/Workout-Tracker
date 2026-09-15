import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconCheckSmall from '../../../assets/icons/icon-check-small.svg'
import iconClock from '../../../assets/icons/icon-clock.svg'
import iconClose from '../../../assets/icons/icon-close.svg'
import iconEdit from '../../../assets/icons/icon-edit.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconRetry from '../../../assets/icons/icon-retry-session.svg'
import iconWarningSmall from '../../../assets/icons/icon-warning-small.svg'
import { cx } from '../../../shared/lib/cx'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import type { Exercise } from '../../exercises/api/exercises'
import { useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { ExerciseThumbnail } from '../../exercises/components/exercise-thumbnail'
import { QuickReferenceSheet } from '../../exercises/components/quick-reference-sheet'
import { IconButton } from '../../../shared/ui/icon-button'
import { useRoutineQuery } from '../../routines/api/use-routines'
import {
  useAddWorkoutExerciseMutation,
  useFinishWorkoutMutation,
  useLastLoggedWeightQuery,
  useLogSetMutation,
  useRoutineTargetsQuery,
  useToggleCompletedMutation,
  useUpdateSetMutation,
  useWorkoutQuery,
} from '../api/use-workout-session'
import type { SetEntry, WorkoutExerciseWithSets } from '../api/workout-session'
import { ExercisePicker } from '../components/exercise-picker/exercise-picker'
import { PlateCalculator } from '../components/plate-calculator/plate-calculator'
import { TagOverlay } from '../components/tag-overlay/tag-overlay'

interface CurrentExercisePanelProps {
  workoutExercise: WorkoutExerciseWithSets
  workoutId: string
  exerciseInfo: Exercise | undefined
  planned: { targetSets: number | null; targetReps: string | null } | undefined
  skipped: boolean
  erroredSetIds: Set<string>
  onToggleSkip: () => void
  onOpenTagOverlay: (set: SetEntry) => void
  onOpenPlateCalculator: (weight: number) => void
  onLogSet: (weight: number) => void
  onCompleteSet: (set: SetEntry) => void
  onRetryComplete: (set: SetEntry) => void
  onChangeWeight: (id: string, weight: number) => void
  onChangeReps: (id: string, reps: number) => void
}

// One exercise at a time, matching `design/figma-reference/06-sesion-activa.md`:
// SET/ANTERIOR/KG/REPS table with per-row states (completed=green,
// current=blue-bordered+editable, future=dimmed dashes, error=red). Only the
// first non-completed row is editable — this is the "current" set; every
// later row is a placeholder until it becomes current. NO live timers
// anywhere (decision already taken — see tasks.md), so there is no rest
// countdown between sets, only a static reference to the last logged weight.
function CurrentExercisePanel({
  workoutExercise,
  workoutId,
  exerciseInfo,
  planned,
  skipped,
  erroredSetIds,
  onToggleSkip,
  onOpenTagOverlay,
  onOpenPlateCalculator,
  onLogSet,
  onCompleteSet,
  onRetryComplete,
  onChangeWeight,
  onChangeReps,
}: CurrentExercisePanelProps) {
  const lastWeightQuery = useLastLoggedWeightQuery(workoutExercise.exercise_id, workoutId)
  const lastWeight = lastWeightQuery.data ?? null
  const [quickReferenceOpen, setQuickReferenceOpen] = useState(false)

  const sets = workoutExercise.set_entries
  const currentSetIndex = sets.findIndex((set) => !set.completed)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ExerciseThumbnail
            src={exerciseInfo?.image}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-border bg-surface-2"
          />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
              {exerciseInfo?.name ?? workoutExercise.exercise_id}
            </h2>
            {lastWeight != null && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
                <img src={iconClock} alt="" className="h-3.5 w-3.5" />
                ÚLTIMO: {lastWeight} KG
              </span>
            )}
            {planned && (
              <span className="font-mono text-xs text-muted">
                Planeado: {planned.targetSets ?? '—'} x {planned.targetReps ?? '—'}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {exerciseInfo?.muscle_group && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-data">
              {exerciseInfo.muscle_group}
            </span>
          )}
          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              aria-label="Referencia rápida del ejercicio"
              onClick={() => setQuickReferenceOpen(true)}
            >
              ?
            </IconButton>
            <Button type="button" variant="ghost" size="sm" onClick={onToggleSkip}>
              {skipped ? 'Deshacer' : 'Saltar'}
            </Button>
          </div>
        </div>
      </div>

      {exerciseInfo && (
        <QuickReferenceSheet
          exerciseId={workoutExercise.exercise_id}
          exercise={exerciseInfo}
          open={quickReferenceOpen}
          onClose={() => setQuickReferenceOpen(false)}
        />
      )}

      {skipped ? (
        <p className="text-sm text-muted">Ejercicio saltado — sus sets quedan sin completar.</p>
      ) : (
        <>
          {/* `px-2` matches the data rows' own inset below (`rounded-lg border px-2`)
              — without it the header labels started 0.5rem to the left of their
              columns, making the spacing look uneven against the real data. */}
          <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_2rem] gap-2 px-2 font-mono text-[10px] uppercase tracking-wide text-muted">
            <span>Set</span>
            <span>Anterior</span>
            <span>Kg</span>
            <span>Reps</span>
            <span />
          </div>

          <ul className="flex flex-col gap-1.5">
            {sets.map((set, index) => {
              const isCurrent = index === currentSetIndex
              const hasError = erroredSetIds.has(set.id)
              const isFuture = !set.completed && !isCurrent

              return (
                <li
                  key={set.id}
                  className={cx(
                    'grid grid-cols-[2rem_1fr_3.5rem_3.5rem_2rem] items-center gap-2 rounded-lg border px-2 py-1.5',
                    set.completed && !hasError && 'border-positive/30 bg-positive/10',
                    isCurrent && !hasError && 'border-data bg-surface-2',
                    isFuture && 'border-transparent opacity-50',
                    hasError && 'border-red-400/40 bg-red-400/10',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpenTagOverlay(set)}
                    className={cx(
                      'text-left font-mono text-sm',
                      set.completed && !hasError ? 'text-positive' : hasError ? 'text-red-300' : 'text-foreground',
                    )}
                  >
                    {index + 1}
                  </button>
                  <span className="font-mono text-xs text-muted">{lastWeight != null ? `${lastWeight}kg` : '—'}</span>

                  {isCurrent ? (
                    <Input
                      aria-label="Peso (kg)"
                      type="number"
                      min={0}
                      value={set.weight}
                      onChange={(event) => onChangeWeight(set.id, Number(event.target.value))}
                      className="w-full bg-surface-2 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-foreground">{isFuture ? '—' : `${set.weight}`}</span>
                  )}

                  {isCurrent ? (
                    <Input
                      aria-label="Reps"
                      type="number"
                      min={0}
                      value={set.reps}
                      onChange={(event) => onChangeReps(set.id, Number(event.target.value))}
                      className="w-full bg-surface-2 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-foreground">{isFuture ? '—' : `${set.reps}`}</span>
                  )}

                  <span className="flex justify-center">
                    {hasError ? (
                      <img src={iconWarningSmall} alt="Error al guardar" className="h-4 w-4" />
                    ) : set.completed ? (
                      <img src={iconCheckSmall} alt="Completado" className="h-4 w-4" />
                    ) : isCurrent ? (
                      <img src={iconEdit} alt="En edición" className="h-4 w-4 opacity-70" />
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Single bordered bar for both actions — previously "Discos" was a
              separate borderless ghost button next to a dashed "Agregar set"
              pill, which read as two unrelated floating controls instead of
              one row. */}
          <div className="flex items-stretch overflow-hidden rounded-xl border border-dashed border-border">
            <button
              type="button"
              onClick={() => onLogSet(lastWeight ?? 0)}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:bg-surface-2"
            >
              <img src={iconPlus} alt="" className="h-3.5 w-3.5" />
              Agregar set
            </button>
            <span aria-hidden="true" className="w-px bg-border" />
            <button
              type="button"
              onClick={() => onOpenPlateCalculator(lastWeight ?? 0)}
              className="flex items-center px-3 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:bg-surface-2"
            >
              Discos
            </button>
          </div>

          {currentSetIndex >= 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              {erroredSetIds.has(sets[currentSetIndex].id) ? (
                <>
                  <span className="font-mono text-xs uppercase tracking-wide text-red-300">
                    Set {currentSetIndex + 1} · Pendiente de guardar
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center gap-1.5"
                    onClick={() => onRetryComplete(sets[currentSetIndex])}
                  >
                    <img src={iconRetry} alt="" className="h-4 w-4" />
                    Reintentar
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-mono text-xs uppercase tracking-wide text-muted">
                    Set {currentSetIndex + 1} de {sets.length}
                  </span>
                  <Button type="button" onClick={() => onCompleteSet(sets[currentSetIndex])}>
                    Completar set
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// `/workout/:id` — the active, resumable session. NO live timers anywhere
// (neither total duration nor rest) — a deliberate, already-taken decision
// (see tasks.md); duration is shown only as a static value on the summary
// page. Completing a set updates its row in place (green checkmark, see
// `CurrentExercisePanel`) with no full-screen interstitial — an earlier
// "Set registrado" overlay forced a manual "Continuar" tap after every
// single set, which was pure friction, not information the row itself
// doesn't already show.
export function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>()
  const workoutId = id as string
  const navigate = useNavigate()

  const workoutQuery = useWorkoutQuery(workoutId)
  const workout = workoutQuery.data
  const routineQuery = useRoutineQuery(workout?.routine_id ?? undefined)
  const routineTargetsQuery = useRoutineTargetsQuery(workout?.routine_id)
  const addExerciseMutation = useAddWorkoutExerciseMutation(workoutId)
  const finishMutation = useFinishWorkoutMutation()
  const logSetMutation = useLogSetMutation(workoutId)
  const updateSetMutation = useUpdateSetMutation(workoutId)
  const toggleCompletedMutation = useToggleCompletedMutation(workoutId)

  const exercises = workout ? workout.workout_exercises.slice().sort((a, b) => a.position - b.position) : []
  const exerciseIds = exercises.map((exercise) => exercise.exercise_id)
  const exerciseInfoQuery = useExercisesByIdsQuery(exerciseIds)
  const exerciseInfoById = new Map((exerciseInfoQuery.data ?? []).map((exercise) => [exercise.id, exercise]))

  const [currentIndex, setCurrentIndex] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [tagOverlaySet, setTagOverlaySet] = useState<SetEntry | null>(null)
  const [plateCalculatorWeight, setPlateCalculatorWeight] = useState<number | null>(null)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [erroredSetIds, setErroredSetIds] = useState<Set<string>>(new Set())
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  // Derived, not stored: clamp defensively during render instead of via an
  // effect + extra state update, in case `exercises` ever shrinks (e.g. a
  // future edit feature) while a later index was already selected.
  const clampedIndex = exercises.length > 0 ? Math.min(currentIndex, exercises.length - 1) : 0

  if (workoutQuery.isLoading || !workout) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  const totalSetsLogged = exercises.reduce((sum, we) => sum + we.set_entries.length, 0)
  // Adding an exercise mid-session is only offered for freestyle workouts (no
  // `routine_id`) and only before any set has been logged at all — once
  // logging has started, the exercise list is frozen for this workout.
  const canAddExercise = workout.routine_id === null && totalSetsLogged === 0

  const targetsByPosition = new Map(
    (routineTargetsQuery.data ?? []).map((target) => [
      target.position,
      { targetSets: target.target_sets, targetReps: target.target_reps },
    ]),
  )

  const currentExercise = exercises[clampedIndex]
  const routineName = workout.routine_id ? (routineQuery.data?.name ?? '…') : 'Freestyle'

  function toggleSkip(workoutExerciseId: string) {
    setSkippedIds((current) => {
      const next = new Set(current)
      if (next.has(workoutExerciseId)) next.delete(workoutExerciseId)
      else next.add(workoutExerciseId)
      return next
    })
  }

  function clearError(setId: string) {
    setErroredSetIds((current) => {
      if (!current.has(setId)) return current
      const next = new Set(current)
      next.delete(setId)
      return next
    })
  }

  function markError(setId: string) {
    setErroredSetIds((current) => new Set(current).add(setId))
  }

  function handleLogSet(weight: number) {
    if (!currentExercise) return
    logSetMutation.mutate({
      workoutExerciseId: currentExercise.id,
      workoutId,
      exerciseId: currentExercise.exercise_id,
      // `reps` defaults to 1, not 0 — `set_entries` requires `reps > 0` for
      // every tag except `failure` (0005_failure_reps_zero.sql).
      weight,
      reps: 1,
      tag: 'normal',
    })
  }

  function handleCompleteSet(set: SetEntry) {
    toggleCompletedMutation.mutate(
      { id: set.id, completed: true },
      {
        onSuccess: () => clearError(set.id),
        onError: () => markError(set.id),
      },
    )
  }

  function handleRetryComplete(set: SetEntry) {
    toggleCompletedMutation.mutate(
      { id: set.id, completed: true },
      {
        onSuccess: () => clearError(set.id),
        onError: () => markError(set.id),
      },
    )
  }

  async function handleFinish() {
    await finishMutation.mutateAsync(workoutId)
    navigate(`/workout/${workoutId}/summary`)
  }

  async function handleSelectExercise(exercise: Exercise) {
    await addExerciseMutation.mutateAsync({ exerciseId: exercise.id, position: exercises.length })
    setPickerOpen(false)
  }

  return (
    <div className="min-h-dvh bg-background pb-10">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <button type="button" aria-label="Cerrar" onClick={() => setCloseConfirmOpen(true)}>
          <img src={iconClose} alt="" className="h-5 w-5" />
        </button>
        <span className="flex-1 min-w-0 truncate font-display text-sm font-bold uppercase tracking-wide text-foreground">
          {routineName}
        </span>
        <Button
          type="button"
          variant="text"
          onClick={handleFinish}
          disabled={finishMutation.isPending}
          className="font-mono text-sm font-bold uppercase text-positive"
        >
          {finishMutation.isPending ? 'Terminando...' : 'Terminar'}
        </Button>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        {exercises.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${((clampedIndex + 1) / exercises.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted">
              {clampedIndex + 1} / {exercises.length}
            </span>
          </div>
        )}

        {exercises.length > 1 && (
          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={clampedIndex === 0}
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            >
              ← Anterior
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={clampedIndex === exercises.length - 1}
              onClick={() => setCurrentIndex((index) => Math.min(exercises.length - 1, index + 1))}
            >
              Siguiente →
            </Button>
          </div>
        )}

        {currentExercise ? (
          <CurrentExercisePanel
            workoutExercise={currentExercise}
            workoutId={workoutId}
            exerciseInfo={exerciseInfoById.get(currentExercise.exercise_id)}
            planned={targetsByPosition.get(currentExercise.position)}
            skipped={skippedIds.has(currentExercise.id)}
            erroredSetIds={erroredSetIds}
            onToggleSkip={() => toggleSkip(currentExercise.id)}
            onOpenTagOverlay={setTagOverlaySet}
            onOpenPlateCalculator={setPlateCalculatorWeight}
            onLogSet={handleLogSet}
            onCompleteSet={handleCompleteSet}
            onRetryComplete={handleRetryComplete}
            onChangeWeight={(setId, weight) =>
              updateSetMutation.mutate({ id: setId, patch: { weight } }, { onError: () => markError(setId) })
            }
            onChangeReps={(setId, reps) =>
              updateSetMutation.mutate({ id: setId, patch: { reps } }, { onError: () => markError(setId) })
            }
          />
        ) : (
          <p className="text-sm text-muted">Este entrenamiento todavía no tiene ejercicios.</p>
        )}

        {canAddExercise && (
          <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
            Agregar ejercicio
          </Button>
        )}
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelectExercise} />

      <TagOverlay
        open={!!tagOverlaySet}
        value={tagOverlaySet?.tag ?? 'normal'}
        onClose={() => setTagOverlaySet(null)}
        onSelect={(tag) => {
          if (tagOverlaySet) updateSetMutation.mutate({ id: tagOverlaySet.id, patch: { tag } })
        }}
      />

      <PlateCalculator
        open={plateCalculatorWeight !== null}
        onClose={() => setPlateCalculatorWeight(null)}
        targetWeight={plateCalculatorWeight ?? 0}
      />

      {closeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">
            Sesión guardada
          </h2>
          <p className="text-sm text-muted">
            Tu progreso queda guardado. Podés retomar este entrenamiento cuando quieras desde el inicio.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button type="button" onClick={() => navigate('/')}>
              Ir al inicio
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCloseConfirmOpen(false)}>
              Seguir entrenando
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
