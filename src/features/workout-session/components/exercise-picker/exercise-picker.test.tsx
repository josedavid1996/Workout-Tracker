import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useExerciseSearchQuery = vi.fn()
const useRelatedExercisesQuery = vi.fn()
// Every result row now mounts a `QuickReferenceSheet` (PR10) for its "?"
// trigger, which calls `useExerciseQuery` as a fallback fetch when no
// `exercise` prop is given — stubbed here since `ExerciseResultItem` always
// passes the already-loaded `exercise`, so the fallback path is never
// exercised by these tests, but the hook must still exist on the mock.
const useExerciseQuery = vi.fn()

vi.mock('../../../exercises/api/use-exercises', () => ({
  useExerciseSearchQuery: (...args: unknown[]) => useExerciseSearchQuery(...args),
  useRelatedExercisesQuery: (...args: unknown[]) => useRelatedExercisesQuery(...args),
  useExerciseQuery: (...args: unknown[]) => useExerciseQuery(...args),
}))

import { ExercisePicker } from './exercise-picker'

// Each result row now mounts a `QuickReferenceSheet` (PR10), which calls
// `useNavigate()` for its "Ver detalle completo" link — needs a real
// `<Router>` ancestor even when that link is never clicked in these tests.
function renderPicker(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const benchPress = { id: 'ex-1', name: 'Bench Press', category: 'strength', body_part: 'chest', equipment: 'barbell', target: null, muscle_group: 'chest', secondary_muscles: null, image: null, gif_url: null, instructions: null, instruction_steps: null }
const inclinePress = { id: 'ex-2', name: 'Incline Press', category: 'strength', body_part: 'chest', equipment: 'barbell', target: null, muscle_group: 'chest', secondary_muscles: null, image: null, gif_url: null, instructions: null, instruction_steps: null }

describe('ExercisePicker', () => {
  beforeEach(() => {
    useExerciseSearchQuery.mockReset()
    useRelatedExercisesQuery.mockReset()
    useExerciseQuery.mockReset()
    useExerciseSearchQuery.mockReturnValue({ data: [benchPress], isLoading: false })
    useRelatedExercisesQuery.mockReturnValue({ data: [], isLoading: false })
    useExerciseQuery.mockReturnValue({ data: undefined, isLoading: false })
  })

  it('does not render when closed', () => {
    renderPicker(<ExercisePicker open={false} onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument()
  })

  it('renders search results and selects an exercise', () => {
    const onSelect = vi.fn()
    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={onSelect} />)

    fireEvent.click(screen.getByText('Bench Press'))
    expect(onSelect).toHaveBeenCalledWith(benchPress)
  })

  it('passes the typed search text as a name filter once debounced', async () => {
    vi.useFakeTimers()
    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText(/buscar ejercicio/i), { target: { value: 'bench' } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(useExerciseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'bench' }))
    vi.useRealTimers()
  })

  it('toggles a category chip filter on and off', () => {
    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={vi.fn()} />)

    const chip = screen.getByRole('button', { name: 'strength' })
    fireEvent.click(chip)
    expect(useExerciseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'strength' }))

    fireEvent.click(chip)
    expect(useExerciseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ category: undefined }))
  })

  it('shows a related section when relatedTo is provided', () => {
    useRelatedExercisesQuery.mockReturnValue({ data: [inclinePress], isLoading: false })

    renderPicker(
      <ExercisePicker
        open
        onClose={vi.fn()}
        onSelect={vi.fn()}
        relatedTo={{ muscleGroup: 'chest', excludeId: 'ex-1' }}
      />,
    )

    expect(screen.getByText(/relacionados/i)).toBeInTheDocument()
    expect(screen.getByText('Incline Press')).toBeInTheDocument()
  })

  it('does not show a related section without relatedTo', () => {
    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(screen.queryByText(/relacionados/i)).not.toBeInTheDocument()
  })
})
