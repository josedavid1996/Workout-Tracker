import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const toggleCompleted = vi.fn()
const updateSet = vi.fn()
const logSet = vi.fn()
const deleteSet = vi.fn()
const removeExercise = vi.fn()
const addExercise = vi.fn(() => Promise.resolve())
const replaceExercise = vi.fn(() => Promise.resolve())
const discardWorkout = vi.fn(() => Promise.resolve())
const finishWorkout = vi.fn(() => Promise.resolve())
const refreshAll = vi.fn()
const useWorkoutQuery = vi.fn()
const usePreviousSessionSetsQuery = vi.fn()

const idle = { isPending: false, isError: false }

vi.mock('../api/use-workout-session', () => ({
  useWorkoutQuery: (...args: unknown[]) => useWorkoutQuery(...args),
  usePreviousSessionSetsQuery: (...args: unknown[]) => usePreviousSessionSetsQuery(...args),
  useRoutineTargetsQuery: () => ({
    data: [{ exercise_id: 'ex-bench', position: 0, target_sets: 2, target_reps: '8-10', notes: 'Pausa abajo' }],
  }),
  useToggleCompletedMutation: () => ({ ...idle, mutate: toggleCompleted }),
  useUpdateSetMutation: () => ({ ...idle, mutate: updateSet }),
  useLogSetMutation: () => ({ ...idle, mutate: logSet }),
  useDeleteSetMutation: () => ({ ...idle, mutate: deleteSet }),
  useRemoveWorkoutExerciseMutation: () => ({ ...idle, mutate: removeExercise }),
  useAddWorkoutExerciseMutation: () => ({ ...idle, mutateAsync: addExercise }),
  useReplaceWorkoutExerciseMutation: () => ({ ...idle, mutateAsync: replaceExercise }),
  useDiscardWorkoutMutation: () => ({ ...idle, mutateAsync: discardWorkout }),
  useFinishWorkoutMutation: () => ({ ...idle, mutateAsync: finishWorkout }),
  useRefreshAllQueries: () => refreshAll,
}))

const exerciseInfo = (id: string, name: string) => ({
  id,
  name,
  category: 'strength',
  body_part: 'chest',
  equipment: 'barbell',
  target: 'pectorals',
  muscle_group: 'chest',
  secondary_muscles: null,
  image: null,
  gif_url: null,
  instructions: null,
  instruction_steps: null,
})

vi.mock('../../exercises/api/use-exercises', () => ({
  useExerciseFocusQuery: () => ({ data: undefined }),
  useExercisesByIdsQuery: () => ({
    data: [exerciseInfo('ex-bench', 'Bench Press'), exerciseInfo('ex-row', 'Barbell Row')],
  }),
}))

vi.mock('../../routines/api/use-routines', () => ({
  useRoutineQuery: () => ({ data: { name: 'Push' } }),
}))

vi.mock('../../exercises/components/quick-reference-sheet', () => ({ QuickReferenceSheet: () => null }))
vi.mock('../components/plate-calculator/plate-calculator', () => ({ PlateCalculator: () => null }))
vi.mock('../components/exercise-picker/exercise-picker', () => ({
  ExercisePicker: ({ open, onSelect }: { open: boolean; onSelect: (exercise: { id: string }) => void }) =>
    open ? (
      <button type="button" onClick={() => onSelect({ id: 'ex-picked' })}>
        pick exercise
      </button>
    ) : null,
}))

import { WorkoutSessionPage } from './workout-session-page'

const set = (id: string, workoutExerciseId: string, exerciseId: string, overrides: Record<string, unknown> = {}) => ({
  id,
  workout_exercise_id: workoutExerciseId,
  workout_id: 'workout-1',
  exercise_id: exerciseId,
  weight: 60,
  reps: 8,
  tag: 'normal',
  completed: false,
  completed_at: null,
  ...overrides,
})

function workout() {
  return {
    id: 'workout-1',
    routine_id: 'routine-1',
    notes: null,
    created_at: '2026-01-10T10:00:00Z',
    finished_at: null,
    workout_exercises: [
      {
        id: 'we-bench',
        workout_id: 'workout-1',
        exercise_id: 'ex-bench',
        position: 0,
        set_entries: [
          set('bench-1', 'we-bench', 'ex-bench', { completed: true, completed_at: '2026-01-10T10:05:00Z' }),
          set('bench-2', 'we-bench', 'ex-bench', { weight: 62.5 }),
        ],
      },
      {
        id: 'we-row',
        workout_id: 'workout-1',
        exercise_id: 'ex-row',
        position: 1,
        set_entries: [set('row-1', 'we-row', 'ex-row', { weight: 0 }), set('row-2', 'we-row', 'ex-row', { weight: 0 })],
      },
    ],
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/workout/workout-1']}>
      <Routes>
        <Route path="/workout/:id" element={<WorkoutSessionPage />} />
        <Route path="/workout/:id/summary" element={<p>SUMMARY</p>} />
        <Route path="/" element={<p>HOME</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function panel(name: string): HTMLElement {
  const card = screen.getByRole('heading', { name }).closest('div.rounded-2xl')
  if (!(card instanceof HTMLElement)) throw new Error(`No panel for ${name}`)
  return card
}

beforeEach(() => {
  vi.clearAllMocks()
  useWorkoutQuery.mockReturnValue({ data: workout(), isLoading: false })
  usePreviousSessionSetsQuery.mockImplementation((exerciseId: string) => ({
    data:
      exerciseId === 'ex-bench'
        ? [
            { weight: 57.5, reps: 10 },
            { weight: 60, reps: 9 },
          ]
        : [],
  }))
})

describe('WorkoutSessionPage', () => {
  it('shows every exercise of the workout at once, with overall set progress', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Bench Press' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Barbell Row' })).toBeInTheDocument()
    expect(screen.getByText('1 / 4 sets')).toBeInTheDocument()
  })

  it('shows what was done on each set last time, and the routine note', () => {
    renderPage()

    const bench = within(panel('Bench Press'))
    expect(bench.getByText('57.5×10')).toBeInTheDocument()
    expect(bench.getByText('60×9')).toBeInTheDocument()
    expect(bench.getByText('Pausa abajo')).toBeInTheDocument()
  })

  it('completes the pre-filled current set in one tap', () => {
    renderPage()

    fireEvent.click(within(panel('Bench Press')).getByRole('button', { name: 'Completar set' }))

    expect(toggleCompleted).toHaveBeenCalledWith({ id: 'bench-2', completed: true }, expect.anything())
  })

  it('does not complete a set whose weight was never filled in', () => {
    renderPage()

    const row = within(panel('Barbell Row'))
    expect(row.getByText('Ingresá el peso (0 si es corporal)')).toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Completar set' })).toBeDisabled()
  })

  it('hands a typed weight to the next still-empty set when the set is completed', () => {
    const data = workout()
    data.workout_exercises[1].set_entries[0].weight = 40
    useWorkoutQuery.mockReturnValue({ data, isLoading: false })
    renderPage()

    fireEvent.click(within(panel('Barbell Row')).getByRole('button', { name: 'Completar set' }))

    expect(toggleCompleted).toHaveBeenCalledWith({ id: 'row-1', completed: true }, expect.anything())
    expect(updateSet).toHaveBeenCalledWith({ id: 'row-2', patch: { weight: 40 } })
  })

  it('un-completes a completed set from its menu', () => {
    renderPage()

    fireEvent.click(within(panel('Bench Press')).getByRole('button', { name: 'Opciones del set 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Desmarcar set' }))

    expect(toggleCompleted).toHaveBeenCalledWith({ id: 'bench-1', completed: false })
  })

  it('deletes a set from its menu, and offers no undo for a pending one', () => {
    renderPage()

    fireEvent.click(within(panel('Bench Press')).getByRole('button', { name: 'Opciones del set 2' }))
    expect(screen.queryByRole('button', { name: 'Desmarcar set' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar set' }))

    expect(deleteSet).toHaveBeenCalledWith('bench-2')
  })

  it('adds an exercise at the end at any point of the session', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Agregar ejercicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick exercise' }))

    await waitFor(() => expect(addExercise).toHaveBeenCalledWith({ exerciseId: 'ex-picked', position: 2 }))
  })

  it('removes an exercise with nothing completed from its menu', () => {
    renderPage()

    fireEvent.click(within(panel('Barbell Row')).getByRole('button', { name: 'Opciones del ejercicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar ejercicio' }))

    expect(removeExercise).toHaveBeenCalledWith('we-row')
  })

  it('swaps an untouched exercise in place', async () => {
    renderPage()

    fireEvent.click(within(panel('Barbell Row')).getByRole('button', { name: 'Opciones del ejercicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar ejercicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick exercise' }))

    await waitFor(() =>
      expect(replaceExercise).toHaveBeenCalledWith({
        workoutExerciseId: 'we-row',
        newExerciseId: 'ex-picked',
        plan: { removeOriginal: true, insertPosition: 1, shifts: [], setCount: 2, reps: 8 },
      }),
    )
  })

  it('keeps an exercise with completed sets when swapping, and does not offer to remove it', async () => {
    renderPage()

    fireEvent.click(within(panel('Bench Press')).getByRole('button', { name: 'Opciones del ejercicio' }))
    expect(screen.queryByRole('button', { name: 'Quitar ejercicio' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar ejercicio' }))
    fireEvent.click(screen.getByRole('button', { name: 'pick exercise' }))

    await waitFor(() =>
      expect(replaceExercise).toHaveBeenCalledWith({
        workoutExerciseId: 'we-bench',
        newExerciseId: 'ex-picked',
        plan: {
          removeOriginal: false,
          insertPosition: 1,
          shifts: [{ id: 'we-row', position: 2 }],
          setCount: 2,
          reps: 8,
        },
      }),
    )
  })

  it('discards the workout only after a second confirmation, then goes home', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Descartar workout' }))
    expect(discardWorkout).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sí, descartar' }))

    await waitFor(() => expect(discardWorkout).toHaveBeenCalledWith('workout-1'))
    expect(await screen.findByText('HOME')).toBeInTheDocument()
  })

  it('finishes an open workout from the header', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }))

    await waitFor(() => expect(finishWorkout).toHaveBeenCalledWith('workout-1'))
    expect(await screen.findByText('SUMMARY')).toBeInTheDocument()
  })

  it('edits an already finished workout without finishing it again or offering to discard it', async () => {
    useWorkoutQuery.mockReturnValue({
      data: { ...workout(), finished_at: '2026-01-10T11:00:00Z' },
      isLoading: false,
    })
    renderPage()

    expect(screen.queryByRole('button', { name: 'Terminar' })).not.toBeInTheDocument()
    fireEvent.click(within(panel('Bench Press')).getByRole('button', { name: 'Opciones del set 2' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar set' }))
    expect(deleteSet).toHaveBeenCalledWith('bench-2')

    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))

    expect(finishWorkout).not.toHaveBeenCalled()
    expect(refreshAll).toHaveBeenCalled()
    expect(await screen.findByText('SUMMARY')).toBeInTheDocument()
  })

  it('closes a finished workout straight back to its summary', async () => {
    useWorkoutQuery.mockReturnValue({
      data: { ...workout(), finished_at: '2026-01-10T11:00:00Z' },
      isLoading: false,
    })
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.queryByRole('button', { name: 'Descartar workout' })).not.toBeInTheDocument()
    expect(await screen.findByText('SUMMARY')).toBeInTheDocument()
  })
})
