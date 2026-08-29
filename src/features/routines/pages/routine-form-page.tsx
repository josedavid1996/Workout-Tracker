import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import iconBack from '../../../assets/icons/icon-back.svg'
import iconDragHandle from '../../../assets/icons/icon-drag-handle.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconRemove from '../../../assets/icons/icon-remove.svg'
import iconRetry from '../../../assets/icons/icon-retry.svg'
import iconWarning from '../../../assets/icons/icon-warning.svg'
import { cx } from '../../../shared/lib/cx'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { DashedButton } from '../../../shared/ui/dashed-button'
import { IconButton } from '../../../shared/ui/icon-button'
import { Input } from '../../../shared/ui/input'
import { Sheet } from '../../../shared/ui/sheet'
import type { Exercise } from '../../exercises/api/exercises'
import { useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { ExercisePicker } from '../../workout-session/components/exercise-picker/exercise-picker'
import type { RoutineExerciseDraft } from '../api/routine-exercises-payload'
import { useCreateRoutineMutation, useRoutineQuery, useUpdateRoutineMutation } from '../api/use-routines'
import { moveDraft } from '../lib/move-draft'

type ExerciseDraft = RoutineExerciseDraft & { key: string }

function toDraft(exercise: RoutineExerciseDraft): ExerciseDraft {
  return { ...exercise, key: crypto.randomUUID() }
}

// Shared create/edit form (`/routines/new` and `/routines/:id/edit`), styled
// to match `design/figma-reference/03-crear-editar-rutina.md`. Business
// logic (reorder via `move-draft.ts`, position recompute via
// `routine-exercises-payload.ts`, create/update mutations) is UNCHANGED
// from PR3/PR4 — this is a presentation rebuild only.
export function RoutineFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()

  const routineQuery = useRoutineQuery(id)
  const createMutation = useCreateRoutineMutation()
  const updateMutation = useUpdateRoutineMutation(id ?? '')

  const [name, setName] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [exercises, setExercises] = useState<ExerciseDraft[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedExercise, setPickedExercise] = useState<Exercise | null>(null)
  const [draftTargetSets, setDraftTargetSets] = useState('')
  const [draftTargetReps, setDraftTargetReps] = useState('')
  const [error, setError] = useState<string | null>(null)

  const hasLoadedInitialData = useRef(false)

  useEffect(() => {
    if (!isEditing || hasLoadedInitialData.current || !routineQuery.data) return

    setName(routineQuery.data.name)
    setExercises(
      routineQuery.data.routine_exercises
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((exercise) =>
          toDraft({
            exerciseId: exercise.exercise_id,
            targetSets: exercise.target_sets,
            targetReps: exercise.target_reps,
          }),
        ),
    )
    hasLoadedInitialData.current = true
  }, [isEditing, routineQuery.data])

  // Resolves real exercise names/muscle groups for the current draft list —
  // fixes the PR4 known limitation (raw `exercise_id` shown instead of the
  // name) and drives the "chips de muscle groups" derived automatically
  // from the added exercises (03-crear-editar-rutina.md).
  const exerciseIds = useMemo(() => exercises.map((exercise) => exercise.exerciseId), [exercises])
  const exerciseDetailsQuery = useExercisesByIdsQuery(exerciseIds)
  const exerciseDetailsById = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const exercise of exerciseDetailsQuery.data ?? []) map.set(exercise.id, exercise)
    return map
  }, [exerciseDetailsQuery.data])

  const touchedMuscleGroups = useMemo(
    () =>
      Array.from(
        new Set(
          exercises
            .map((exercise) => exerciseDetailsById.get(exercise.exerciseId)?.muscle_group)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [exercises, exerciseDetailsById],
  )

  function handlePickExercise(exercise: Exercise) {
    setPickedExercise(exercise)
    setPickerOpen(false)
  }

  function handleConfirmExercise(event: FormEvent) {
    event.preventDefault()
    if (!pickedExercise) return

    setExercises((current) => [
      ...current,
      toDraft({
        exerciseId: pickedExercise.id,
        targetSets: draftTargetSets ? Number(draftTargetSets) : null,
        targetReps: draftTargetReps.trim() || null,
      }),
    ])

    setPickedExercise(null)
    setDraftTargetSets('')
    setDraftTargetReps('')
  }

  function handleRemoveExercise(key: string) {
    setExercises((current) => current.filter((exercise) => exercise.key !== key))
  }

  function handleMoveExercise(index: number, direction: 'up' | 'down') {
    setExercises((current) => moveDraft(current, index, direction))
  }

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault()
    setError(null)

    const payload = exercises.map(({ key: _key, ...rest }) => rest)

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ name, exercises: payload })
      } else {
        await createMutation.mutateAsync({ name, exercises: payload })
      }
      navigate('/routines')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar la rutina.')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isEditing && routineQuery.isLoading) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <IconButton aria-label="Volver" onClick={() => navigate(-1)}>
          <img src={iconBack} alt="" className="h-4 w-4" />
        </IconButton>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          {isEditing ? 'Editar rutina' : 'Nueva rutina'}
        </h1>
        <Button
          type="button"
          variant="text"
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className={cx('font-display text-sm uppercase tracking-wide', error ? 'text-muted' : 'text-data')}
        >
          Guardar
        </Button>
      </header>

      <form className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">Nombre</span>
          <Input
            aria-label="Nombre"
            required
            value={name}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            onChange={(event) => setName(event.target.value)}
            className={cx(
              'font-display text-xl font-bold uppercase',
              nameFocused && 'border-data',
            )}
          />
        </div>

        {touchedMuscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {touchedMuscleGroups.map((muscleGroup) => (
              <span
                key={muscleGroup}
                className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-data"
              >
                {muscleGroup}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="font-display text-sm uppercase tracking-wide text-muted">
            Ejercicios · {exercises.length}
          </span>

          {exercises.length === 0 && (
            <p className="text-sm text-muted">Todavía no agregaste ejercicios.</p>
          )}

          <ul className="flex flex-col gap-2">
            {exercises.map((exercise, index) => (
              <li
                key={exercise.key}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <img src={iconDragHandle} alt="" className="h-4 w-4 shrink-0 text-muted" />
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {exerciseDetailsById.get(exercise.exerciseId)?.name ?? exercise.exerciseId}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {exercise.targetSets ?? '—'} × {exercise.targetReps ?? '—'}
                  </span>
                </div>
                {/* No real drag-and-drop in scope (per 03-crear-editar-rutina.md) —
                    the grip icon above is visual only; reordering still uses the
                    tested `moveDraft` up/down logic via these buttons. */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label="Mover arriba"
                    disabled={index === 0}
                    onClick={() => handleMoveExercise(index, 'up')}
                    className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Mover abajo"
                    disabled={index === exercises.length - 1}
                    onClick={() => handleMoveExercise(index, 'down')}
                    className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Quitar"
                    onClick={() => handleRemoveExercise(exercise.key)}
                    className="rounded p-1 text-muted hover:text-red-400"
                  >
                    <img src={iconRemove} alt="" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <DashedButton onClick={() => setPickerOpen(true)} className="py-2.5 text-sm text-data">
            <img src={iconPlus} alt="" className="h-4 w-4" />
            Agregar ejercicio
          </DashedButton>
        </div>
      </form>

      {/* Not `fixed` (unlike the PR7/PR8 version): with `<BottomNav/>` now
          also fixed to the viewport bottom on this page (PR9), a second
          fixed bottom bar would overlap it. Placed in normal flow instead,
          right after the form — `pb-28` on the outer container already
          keeps it clear of `<BottomNav/>`. */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <img src={iconWarning} alt="" className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-col">
                <span>No se pudo guardar</span>
                <span className="text-xs text-red-300">Se guardó localmente. Reintentá para sincronizar.</span>
              </div>
            </div>
          )}

          <Button type="button" onClick={() => handleSubmit()} disabled={isSaving} className="flex items-center justify-center gap-2">
            {error && <img src={iconRetry} alt="" className="h-4 w-4" />}
            {isSaving ? 'Guardando...' : error ? 'Reintentar guardado' : 'Guardar rutina'}
          </Button>
        </div>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickExercise} />

      <Sheet
        open={!!pickedExercise}
        onClose={() => setPickedExercise(null)}
        title={pickedExercise ? pickedExercise.name : 'Agregar ejercicio'}
      >
        <form className="flex flex-col gap-3" onSubmit={handleConfirmExercise}>
          <Input
            label="Series objetivo"
            type="number"
            min={0}
            value={draftTargetSets}
            onChange={(event) => setDraftTargetSets(event.target.value)}
          />
          <Input
            label="Reps objetivo"
            placeholder="8-10"
            value={draftTargetReps}
            onChange={(event) => setDraftTargetReps(event.target.value)}
          />
          <Button type="submit">Agregar</Button>
        </form>
      </Sheet>

      <BottomNav />
    </div>
  )
}
