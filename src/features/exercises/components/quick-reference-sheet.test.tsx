import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Exercise } from '../api/exercises'

const useSimilarExercisesQuery = vi.fn()

vi.mock('../api/use-exercises', () => ({
  useExerciseQuery: () => ({ data: undefined, isLoading: false }),
  useExerciseFocusQuery: () => ({ data: undefined }),
  useSimilarExercisesQuery: (...args: unknown[]) => useSimilarExercisesQuery(...args),
}))

import { QuickReferenceSheet } from './quick-reference-sheet'

function makeExercise(id: string, name: string): Exercise {
  return {
    id,
    name,
    category: null,
    body_part: null,
    equipment: 'dumbbell',
    target: 'delts',
    muscle_group: null,
    secondary_muscles: null,
    image: null,
    gif_url: null,
    instructions: null,
    instruction_steps: null,
  }
}

const lateralRaise = makeExercise('ex-1', 'Lateral Raise')
const cableRaise = makeExercise('ex-2', 'Cable Lateral Raise')

function renderSheet(inline: boolean, onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/routines/new']}>
      <Routes>
        <Route
          path="/routines/new"
          element={
            <QuickReferenceSheet exerciseId={lateralRaise.id} exercise={lateralRaise} open onClose={onClose} inline={inline} />
          }
        />
        <Route path="/exercises/:id" element={<p>Detail page</p>} />
      </Routes>
    </MemoryRouter>,
  )
  return onClose
}

describe('QuickReferenceSheet', () => {
  beforeEach(() => {
    useSimilarExercisesQuery.mockReset()
    useSimilarExercisesQuery.mockImplementation((exercise: Exercise | undefined) => ({
      data: exercise?.id === lateralRaise.id ? [{ exercise: cableRaise, focus: null }] : [],
    }))
  })

  it('inline: swaps to a similar exercise in place and goes back, without navigating', () => {
    const onClose = renderSheet(true)

    expect(screen.queryByRole('button', { name: 'Ver detalle completo' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cable Lateral Raise/ }))

    expect(screen.getByRole('heading', { name: 'Cable Lateral Raise' })).toBeInTheDocument()
    expect(screen.queryByText('Detail page')).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '← Volver' }))

    expect(screen.getByRole('heading', { name: 'Lateral Raise' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '← Volver' })).not.toBeInTheDocument()
  })

  it('default: tapping a similar exercise navigates to its detail page', () => {
    const onClose = renderSheet(false)

    expect(screen.getByRole('button', { name: 'Ver detalle completo' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cable Lateral Raise/ }))

    expect(onClose).toHaveBeenCalled()
    expect(screen.getByText('Detail page')).toBeInTheDocument()
  })
})
