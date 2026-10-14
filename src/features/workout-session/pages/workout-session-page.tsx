import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconCheckSmall from '../../../assets/icons/icon-check-small.svg'
import iconClock from '../../../assets/icons/icon-clock.svg'
import iconClose from '../../../assets/icons/icon-close.svg'
import iconEdit from '../../../assets/icons/icon-edit.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconRetry from '../../../assets/icons/icon-retry-session.svg'
import iconWarningSmall from '../../../assets/icons/icon-warning-small.svg'
import { cx } from '../../../shared/lib/cx'
import { useWakeLock } from '../../../shared/lib/use-wake-lock'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { Sheet } from '../../../shared/ui/sheet'
import type { Exercise } from '../../exercises/api/exercises'
import { useExerciseFocusQuery, useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { ExerciseThumbnail } from '../../exercises/components/exercise-thumbnail'
import { QuickReferenceSheet } from '../../exercises/components/quick-reference-sheet'
import { primaryMuscleLabel } from '../../exercises/lib/exercise-labels'
import { IconButton } from '../../../shared/ui/icon-button'
import { useRoutineQuery } from '../../routines/api/use-routines'
import {
  useAddWorkoutExerciseMutation,
  useDeleteSetMutation,
  useDiscardWorkoutMutation,
  useFinishWorkoutMutation,
  useLogSetMutation,
  usePreviousSessionSetsQuery,
  useRefreshAllQueries,
  useRemoveWorkoutExerciseMutation,
  useReplaceWorkoutExerciseMutation,
  useRoutineTargetsQuery,
  useToggleCompletedMutation,
  useUpdateSetMutation,
  useWorkoutQuery,
} from '../api/use-workout-session'
import type { SetEntry, WorkoutExerciseWithSets } from '../api/workout-session'
import { ExercisePicker } from '../components/exercise-picker/exercise-picker'
import { PlateCalculator } from '../components/plate-calculator/plate-calculator'
import { TagOverlay } from '../components/tag-overlay/tag-overlay'
import { planExerciseSwap } from '../lib/exercise-swap'
import type { NewSetDefaults } from '../lib/new-set-defaults'
import { occurrenceIndexes } from '../lib/prefill-sets'
import { newSetDefaults, parseWeightInput } from '../lib/new-set-defaults'
import { reorderByRememberedIds } from '../lib/reorder-by-remembered-ids'
import type { WeightOverride } from '../lib/session-sets'
import { isWeightMissing, orderSets } from '../lib/session-sets'

interface ExercisePanelProps {
  workoutExercise: WorkoutExerciseWithSets
  workoutId: string
  // Which repeat of its exercise this card is (0 unless the workout lists
  // the same exercise more than once).
  occurrence: number
  // Editing an already finished workout: every row is editable in place.
  editAll: boolean
  exerciseInfo: Exercise | undefined
  planned: { targetSets: number | null; targetReps: string | null; notes: string | null } | undefined
  skipped: boolean
  erroredSetIds: Set<string>
  onOpenMenu: () => void
  onOpenTagOverlay: (set: SetEntry) => void
  onOpenPlateCalculator: (weight: number) => void
  // Per-set answer to "is a stored 0 kg real?" — see `isWeightMissing`. A
  // set with a missing weight shows empty and is not completable until filled.
  weightOverrides: Map<string, WeightOverride>
  onLogSet: (defaults: NewSetDefaults) => void
  onCompleteSet: (set: SetEntry) => void
  onRetryComplete: (set: SetEntry) => void
  onChangeWeight: (id: string, weight: number | null) => void
  onChangeReps: (id: string, reps: number) => void
}

// One card per exercise, all of them on screen at once (the session used to
// show a single exercise with previous/next buttons). The table itself still
// follows `design/figma-reference/06-sesion-activa.md`:
// SET/ANTERIOR/KG/REPS table with per-row states (completed=green,
// current=blue-bordered+editable, future=dimmed, error=red). Rows are
// pre-filled when the workout starts (`startWorkout`), so the usual gesture
// is just "Completar set". Only the first non-completed row is editable —
// this is the "current" set; later rows show their planned values dimmed
// until they become current. "Anterior" is what was done on the same set
// last time. NO live timers anywhere (decision already taken — see
// tasks.md), so there is no rest countdown between sets. Tapping a set's
// number opens its menu (tag, undo, delete); "⋯" opens the exercise's.
function ExercisePanel({
  workoutExercise,
  workoutId,
  occurrence,
  editAll,
  exerciseInfo,
  planned,
  skipped,
  erroredSetIds,
  weightOverrides,
  onOpenMenu,
  onOpenTagOverlay,
  onOpenPlateCalculator,
  onLogSet,
  onCompleteSet,
  onRetryComplete,
  onChangeWeight,
  onChangeReps,
}: ExercisePanelProps) {
  const previousSetsQuery = usePreviousSessionSetsQuery(workoutExercise.exercise_id, workoutId, occurrence)
  const previousSets = previousSetsQuery.data ?? []
  // The most recently completed countable set of the previous session.
  const lastWeight = previousSets.at(-1)?.weight ?? null
  const [quickReferenceOpen, setQuickReferenceOpen] = useState(false)
  // Raw text typed in the current set's weight input, so the field shows
  // exactly what was typed (including empty) while the update round-trips.
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({})
  const focusQuery = useExerciseFocusQuery(exerciseInfo?.id)
  const muscleText = exerciseInfo ? primaryMuscleLabel(focusQuery.data?.focus, exerciseInfo.target) : ''

  const sets = workoutExercise.set_entries
  const currentSetIndex = sets.findIndex((set) => !set.completed)
  const currentSet = currentSetIndex >= 0 ? sets[currentSetIndex] : undefined
  const weightMissing = (set: SetEntry) => isWeightMissing(set, weightOverrides.get(set.id))
  const currentWeightMissing = currentSet ? weightMissing(currentSet) : false

  const weightInputValue = (set: SetEntry) => weightDrafts[set.id] ?? (weightMissing(set) ? '' : String(set.weight))

  const handleWeightInput = (set: SetEntry, raw: string) => {
    setWeightDrafts((current) => ({ ...current, [set.id]: raw }))
    onChangeWeight(set.id, parseWeightInput(raw))
  }

  const handleAddSet = () => {
    const previous = sets.at(-1)
    onLogSet(
      newSetDefaults({
        previousSet: previous && !weightMissing(previous) ? previous : null,
        lastWeight,
        plannedReps: planned?.targetReps ?? null,
      }),
    )
  }

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
            {planned?.notes && <span className="text-xs text-muted">{planned.notes}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {muscleText && (
            <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-data">
              {muscleText}
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
            <IconButton size="sm" aria-label="Opciones del ejercicio" onClick={onOpenMenu}>
              ⋯
            </IconButton>
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
              const editable = isCurrent || editAll

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
                    aria-label={`Opciones del set ${index + 1}`}
                    onClick={() => onOpenTagOverlay(set)}
                    className={cx(
                      'text-left font-mono text-sm',
                      set.completed && !hasError ? 'text-positive' : hasError ? 'text-red-300' : 'text-foreground',
                    )}
                  >
                    {index + 1}
                  </button>
                  <span className="font-mono text-xs text-muted">
                    {previousSets[index] ? `${previousSets[index].weight}×${previousSets[index].reps}` : '—'}
                  </span>

                  {editable ? (
                    <Input
                      aria-label="Peso (kg)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      placeholder="kg"
                      value={weightInputValue(set)}
                      onChange={(event) => handleWeightInput(set, event.target.value)}
                      className="w-full bg-surface-2 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-foreground">{weightMissing(set) ? '—' : `${set.weight}`}</span>
                  )}

                  {editable ? (
                    <Input
                      aria-label="Reps"
                      type="number"
                      min={0}
                      value={set.reps}
                      onChange={(event) => onChangeReps(set.id, Number(event.target.value))}
                      className="w-full bg-surface-2 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-foreground">{set.reps}</span>
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
              onClick={handleAddSet}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:bg-surface-2"
            >
              <img src={iconPlus} alt="" className="h-3.5 w-3.5" />
              Agregar set
            </button>
            <span aria-hidden="true" className="w-px bg-border" />
            <button
              type="button"
              onClick={() =>
                onOpenPlateCalculator(currentSet && !currentWeightMissing ? currentSet.weight : (lastWeight ?? 0))
              }
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
                    {currentWeightMissing ? 'Ingresá el peso (0 si es corporal)' : `Set ${currentSetIndex + 1} de ${sets.length}`}
                  </span>
                  <Button
                    type="button"
                    disabled={currentWeightMissing}
                    onClick={() => onCompleteSet(sets[currentSetIndex])}
                  >
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

// `/workout/:id` — the active, resumable session: every exercise of the
// workout in one scrollable list. NO live timers anywhere
// (neither total duration nor rest) — a deliberate, already-taken decision
// (see tasks.md); duration is shown only as a static value on the summary
// page. Completing a set updates its row in place (green checkmark, see
// `ExercisePanel`) with no full-screen interstitial — an earlier
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
  const removeExerciseMutation = useRemoveWorkoutExerciseMutation(workoutId)
  const replaceExerciseMutation = useReplaceWorkoutExerciseMutation(workoutId)
  const deleteSetMutation = useDeleteSetMutation(workoutId)
  const discardMutation = useDiscardWorkoutMutation()
  const finishMutation = useFinishWorkoutMutation()
  const refreshAllQueries = useRefreshAllQueries()
  const logSetMutation = useLogSetMutation(workoutId)
  const updateSetMutation = useUpdateSetMutation(workoutId)
  const toggleCompletedMutation = useToggleCompletedMutation(workoutId)

  // `set_entries` has no reliable insertion-order column on the live schema
  // yet (see `reorder-by-remembered-ids.ts`) — Postgres/PostgREST gives no
  // ordering guarantee across fetches, so an UPDATE elsewhere (e.g. tagging
  // a set) can silently reshuffle which weight/reps shows under "Set 1"/
  // "Set 2" on the next fetch. This remembers the on-screen order for the
  // life of this page and re-applies it to every new fetch.
  //
  // setState during render (not in an effect) is the documented pattern for
  // "storing information from previous renders" — https://react.dev/learn/
  // you-might-not-need-an-effect#storing-information-from-previous-renders
  // — it lets this same render use the corrected order (no one-frame
  // flicker of the wrong order, which an effect-based update would cause).
  const [rememberedSetOrder, setRememberedSetOrder] = useState<Map<string, string[]>>(new Map())

  const exercises = useMemo(() => {
    if (!workout) return []
    return workout.workout_exercises
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((exercise) => ({
        ...exercise,
        set_entries: reorderByRememberedIds(orderSets(exercise.set_entries), rememberedSetOrder.get(exercise.id)),
      }))
  }, [workout, rememberedSetOrder])

  let nextRememberedSetOrder: Map<string, string[]> | null = null
  for (const exercise of exercises) {
    const ids = exercise.set_entries.map((set) => set.id)
    const existing = rememberedSetOrder.get(exercise.id)
    const isSame = existing && existing.length === ids.length && existing.every((id, index) => id === ids[index])
    if (!isSame) {
      nextRememberedSetOrder ??= new Map(rememberedSetOrder)
      nextRememberedSetOrder.set(exercise.id, ids)
    }
  }
  if (nextRememberedSetOrder) {
    setRememberedSetOrder(nextRememberedSetOrder)
  }

  const exerciseIds = exercises.map((exercise) => exercise.exercise_id)
  const exerciseInfoQuery = useExercisesByIdsQuery(exerciseIds)
  const exerciseInfoById = new Map((exerciseInfoQuery.data ?? []).map((exercise) => [exercise.id, exercise]))

  // `'add'` appends a new exercise; `{ swapId }` replaces that workout
  // exercise with the picked one.
  const [pickerMode, setPickerMode] = useState<'add' | { swapId: string } | null>(null)
  const [menuExerciseId, setMenuExerciseId] = useState<string | null>(null)
  const [tagOverlaySet, setTagOverlaySet] = useState<SetEntry | null>(null)
  const [plateCalculatorWeight, setPlateCalculatorWeight] = useState<number | null>(null)
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const [erroredSetIds, setErroredSetIds] = useState<Set<string>>(new Set())
  // `set_entries.weight` is NOT NULL, so an unknown weight is stored as 0 —
  // a pending set at 0 kg shows empty and can't be completed until the user
  // types a value. These overrides record what the user did with the field
  // (cleared it, or typed an explicit 0). Page-lifetime only: after a reload
  // an explicit pending 0 has to be typed again.
  const [weightOverrides, setWeightOverrides] = useState<Map<string, WeightOverride>>(new Map())
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

  // Screen stays on for as long as an unfinished workout is on screen.
  useWakeLock(!!workout && workout.finished_at === null)

  if (workoutQuery.isLoading || !workout) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  const allSets = exercises.flatMap((exercise) => exercise.set_entries)
  const completedSetCount = allSets.filter((set) => set.completed).length

  // Matched by exercise, not position: positions shift once an exercise is
  // added or swapped mid-session. A routine may list the same exercise more
  // than once, so the nth card of an exercise takes its nth routine target.
  const targetsByExerciseId = new Map<
    string,
    { targetSets: number | null; targetReps: string | null; notes: string | null }[]
  >()
  for (const target of routineTargetsQuery.data ?? []) {
    const list = targetsByExerciseId.get(target.exercise_id) ?? []
    list.push({ targetSets: target.target_sets, targetReps: target.target_reps, notes: target.notes })
    targetsByExerciseId.set(target.exercise_id, list)
  }
  const occurrences = occurrenceIndexes(exercises.map((exercise) => exercise.exercise_id))

  const routineName = workout.routine_id ? (routineQuery.data?.name ?? '…') : 'Freestyle'
  // A finished workout opened from its summary ("Editar sets"): same
  // screen, but leaving it never touches `finished_at` (which would change
  // its recorded duration) and it can't be discarded from here.
  const isFinished = workout.finished_at !== null
  // A set completed while editing a finished workout is dated with that
  // workout, not today — `completed_at` drives every "last time" and weekly
  // view. `undefined` (an open workout) means "now".
  const completedAtOverride = workout.finished_at ? { completedAt: workout.finished_at } : {}
  const menuExercise = exercises.find((exercise) => exercise.id === menuExerciseId)
  const menuExerciseHasCompletedSets = menuExercise?.set_entries.some((set) => set.completed) ?? false
  const swapExercise =
    pickerMode && pickerMode !== 'add' ? exercises.find((exercise) => exercise.id === pickerMode.swapId) : undefined
  const swapExerciseInfo = swapExercise ? exerciseInfoById.get(swapExercise.exercise_id) : undefined

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

  function setWeightOverride(setId: string, override: WeightOverride | undefined) {
    setWeightOverrides((current) => {
      if (current.get(setId) === override) return current
      const next = new Map(current)
      if (override) next.set(setId, override)
      else next.delete(setId)
      return next
    })
  }

  function handleLogSet(workoutExercise: WorkoutExerciseWithSets, { weight, reps }: NewSetDefaults) {
    logSetMutation.mutate(
      {
        workoutExerciseId: workoutExercise.id,
        workoutId,
        exerciseId: workoutExercise.exercise_id,
        // `reps` is always > 0 here — `set_entries` requires it for every tag
        // except `failure` (0005_failure_reps_zero.sql).
        weight: weight ?? 0,
        reps,
        tag: 'normal',
      },
      {
        // An explicit 0 copied from the previous set is a real bodyweight 0.
        onSuccess: (created) => {
          if (weight === 0) setWeightOverride(created.id, 'confirmed')
        },
      },
    )
  }

  function handleChangeWeight(setId: string, weight: number | null) {
    if (weight === null) {
      setWeightOverride(setId, 'missing')
      return
    }
    setWeightOverride(setId, weight === 0 ? 'confirmed' : undefined)
    updateSetMutation.mutate({ id: setId, patch: { weight } }, { onError: () => markError(setId) })
  }

  function handleCompleteSet(set: SetEntry) {
    // Never silently save an unknown weight as 0 (see `isWeightMissing`).
    if (isWeightMissing(set, weightOverrides.get(set.id))) return
    toggleCompletedMutation.mutate(
      { id: set.id, completed: true, ...completedAtOverride },
      {
        onSuccess: () => clearError(set.id),
        onError: () => markError(set.id),
      },
    )

    // Typing the weight once is enough: the next pending set of the same
    // exercise that still has no weight inherits this one.
    const siblings = exercises.find((exercise) => exercise.id === set.workout_exercise_id)?.set_entries ?? []
    const next = siblings.find((sibling) => !sibling.completed && sibling.id !== set.id)
    if (next && isWeightMissing(next, weightOverrides.get(next.id))) {
      setWeightOverride(next.id, set.weight === 0 ? 'confirmed' : undefined)
      if (next.weight !== set.weight) updateSetMutation.mutate({ id: next.id, patch: { weight: set.weight } })
    }
  }

  function handleRetryComplete(set: SetEntry) {
    toggleCompletedMutation.mutate(
      { id: set.id, completed: true, ...completedAtOverride },
      {
        onSuccess: () => clearError(set.id),
        onError: () => markError(set.id),
      },
    )
  }

  function handleDoneEditing() {
    refreshAllQueries()
    navigate(`/workout/${workoutId}/summary`)
  }

  async function handleFinish() {
    await finishMutation.mutateAsync(workoutId)
    navigate(`/workout/${workoutId}/summary`)
  }

  async function handleSelectExercise(exercise: Exercise) {
    const mode = pickerMode
    setPickerMode(null)
    if (mode === 'add') {
      const nextPosition = exercises.reduce((max, item) => Math.max(max, item.position + 1), 0)
      await addExerciseMutation.mutateAsync({ exerciseId: exercise.id, position: nextPosition })
      return
    }
    if (!mode || !swapExercise) return
    await replaceExerciseMutation.mutateAsync({
      workoutExerciseId: swapExercise.id,
      newExerciseId: exercise.id,
      plan: planExerciseSwap({
        target: { id: swapExercise.id, position: swapExercise.position, sets: swapExercise.set_entries },
        others: exercises.filter((item) => item.id !== swapExercise.id),
      }),
    })
  }

  async function handleDiscard() {
    await discardMutation.mutateAsync(workoutId)
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-background pb-10">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => (isFinished ? handleDoneEditing() : setCloseConfirmOpen(true))}
        >
          <img src={iconClose} alt="" className="h-5 w-5" />
        </button>
        <span className="flex-1 min-w-0 truncate font-display text-sm font-bold uppercase tracking-wide text-foreground">
          {routineName}
        </span>
        <Button
          type="button"
          variant="text"
          onClick={isFinished ? handleDoneEditing : handleFinish}
          disabled={finishMutation.isPending}
          className="font-mono text-sm font-bold uppercase text-positive"
        >
          {isFinished ? 'Listo' : finishMutation.isPending ? 'Terminando...' : 'Terminar'}
        </Button>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        {allSets.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(completedSetCount / allSets.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted">
              {completedSetCount} / {allSets.length} sets
            </span>
          </div>
        )}

        {exercises.length === 0 && (
          <p className="text-sm text-muted">Este entrenamiento todavía no tiene ejercicios.</p>
        )}

        {exercises.map((workoutExercise, index) => (
          <ExercisePanel
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            workoutId={workoutId}
            occurrence={occurrences[index]}
            editAll={isFinished}
            exerciseInfo={exerciseInfoById.get(workoutExercise.exercise_id)}
            planned={targetsByExerciseId.get(workoutExercise.exercise_id)?.[occurrences[index]]}
            skipped={skippedIds.has(workoutExercise.id)}
            erroredSetIds={erroredSetIds}
            weightOverrides={weightOverrides}
            onOpenMenu={() => setMenuExerciseId(workoutExercise.id)}
            onOpenTagOverlay={setTagOverlaySet}
            onOpenPlateCalculator={setPlateCalculatorWeight}
            onLogSet={(defaults) => handleLogSet(workoutExercise, defaults)}
            onCompleteSet={handleCompleteSet}
            onRetryComplete={handleRetryComplete}
            onChangeWeight={handleChangeWeight}
            onChangeReps={(setId, reps) =>
              updateSetMutation.mutate({ id: setId, patch: { reps } }, { onError: () => markError(setId) })
            }
          />
        ))}

        {(addExerciseMutation.isError || replaceExerciseMutation.isError || removeExerciseMutation.isError) && (
          <p className="text-sm text-red-400">No se pudo actualizar los ejercicios. Probá de nuevo.</p>
        )}
        {deleteSetMutation.isError && <p className="text-sm text-red-400">No se pudo eliminar el set.</p>}

        <Button type="button" variant="secondary" onClick={() => setPickerMode('add')}>
          Agregar ejercicio
        </Button>
      </div>

      <ExercisePicker
        open={pickerMode !== null}
        onClose={() => setPickerMode(null)}
        onSelect={handleSelectExercise}
        relatedTo={
          swapExercise && swapExerciseInfo?.target
            ? { target: swapExerciseInfo.target, excludeId: swapExercise.exercise_id }
            : undefined
        }
      />

      <Sheet open={!!menuExercise} onClose={() => setMenuExerciseId(null)} title="Opciones del ejercicio">
        {menuExercise && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPickerMode({ swapId: menuExercise.id })
                setMenuExerciseId(null)
              }}
            >
              Cambiar ejercicio
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                toggleSkip(menuExercise.id)
                setMenuExerciseId(null)
              }}
            >
              {skippedIds.has(menuExercise.id) ? 'Deshacer salto' : 'Saltar ejercicio'}
            </Button>
            {menuExerciseHasCompletedSets ? (
              <p className="text-xs text-muted">
                Ya tiene sets completados: al cambiarlo se conserva y el nuevo ejercicio se agrega debajo.
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-red-300"
                onClick={() => {
                  removeExerciseMutation.mutate(menuExercise.id)
                  setMenuExerciseId(null)
                }}
              >
                Quitar ejercicio
              </Button>
            )}
          </div>
        )}
      </Sheet>

      <TagOverlay
        open={!!tagOverlaySet}
        value={tagOverlaySet?.tag ?? 'normal'}
        onClose={() => setTagOverlaySet(null)}
        onSelect={(tag) => {
          if (tagOverlaySet) updateSetMutation.mutate({ id: tagOverlaySet.id, patch: { tag } })
        }}
        // Not offered on a finished workout: its rows are edited in place,
        // and un-completing would lose the set's original completion date.
        onUncomplete={
          tagOverlaySet?.completed && !isFinished
            ? () => toggleCompletedMutation.mutate({ id: tagOverlaySet.id, completed: false })
            : undefined
        }
        onDelete={() => {
          if (tagOverlaySet) deleteSetMutation.mutate(tagOverlaySet.id)
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
            <Button
              type="button"
              variant="ghost"
              className="text-red-300"
              onClick={() => {
                setCloseConfirmOpen(false)
                setDiscardConfirmOpen(true)
              }}
            >
              Descartar workout
            </Button>
          </div>
        </div>
      )}

      {discardConfirmOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center">
          <h2 className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">
            ¿Descartar workout?
          </h2>
          <p className="text-sm text-muted">
            Se borra este entrenamiento con todos sus sets. No queda en el historial y no se puede deshacer.
          </p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button type="button" disabled={discardMutation.isPending} onClick={handleDiscard}>
              {discardMutation.isPending ? 'Descartando...' : 'Sí, descartar'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDiscardConfirmOpen(false)}>
              Cancelar
            </Button>
            {discardMutation.isError && <p className="text-sm text-red-400">No se pudo descartar. Probá de nuevo.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
