import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const bench = {
  id: 'ex-bench',
  name: 'barbell bench press',
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
}

vi.mock('../api/use-routines', () => ({
  useRoutinesWithExercisesQuery: () => ({
    isLoading: false,
    isError: false,
    data: [
      {
        id: 'routine-1',
        name: 'Pecho',
        created_at: '2026-01-01',
        day_of_week: 0,
        routine_exercises: [
          {
            id: 're-1',
            routine_id: 'routine-1',
            exercise_id: 'ex-bench',
            position: 0,
            target_sets: 4,
            target_reps: '8-10',
            notes: null,
          },
        ],
      },
    ],
  }),
}))

vi.mock('../../exercises/api/use-exercises', () => ({
  useExercisesByIdsQuery: () => ({ data: [bench] }),
}))

// Stand-in for the real sheet: shows which exercise it was opened with.
vi.mock('../../exercises/components/quick-reference-sheet', () => ({
  QuickReferenceSheet: ({
    open,
    exerciseId,
    exercise,
    onClose,
  }: {
    open: boolean
    exerciseId: string
    exercise?: { name: string }
    onClose: () => void
  }) =>
    open ? (
      <div role="dialog">
        <span>{`ficha:${exerciseId}:${exercise?.name ?? 'sin datos'}`}</span>
        <button type="button" onClick={onClose}>
          cerrar ficha
        </button>
      </div>
    ) : null,
}))

import { RoutineWeeklyPreviewPage } from './routine-weekly-preview-page'

function renderPage() {
  return render(
    <MemoryRouter>
      <RoutineWeeklyPreviewPage />
    </MemoryRouter>,
  )
}

describe('RoutineWeeklyPreviewPage', () => {
  it('shows no exercise preview until an exercise is tapped', () => {
    renderPage()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the exercise quick reference, with the already loaded exercise, when its row is tapped', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /barbell bench press/ }))

    expect(screen.getByText('ficha:ex-bench:barbell bench press')).toBeInTheDocument()
  })

  it('closes the preview and goes back to the week', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /barbell bench press/ }))
    fireEvent.click(screen.getByRole('button', { name: 'cerrar ficha' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('4 × 8-10')).toBeInTheDocument()
  })
})
