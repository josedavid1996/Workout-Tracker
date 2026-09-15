import { act, fireEvent, render, screen, within } from '@testing-library/react'
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

const benchPress = { id: 'ex-1', name: 'Bench Press', category: 'chest', body_part: 'chest', equipment: 'barbell', target: null, muscle_group: 'chest', secondary_muscles: null, image: null, gif_url: null, instructions: null, instruction_steps: null }
const inclinePress = { id: 'ex-2', name: 'Incline Press', category: 'chest', body_part: 'chest', equipment: 'barbell', target: null, muscle_group: 'chest', secondary_muscles: null, image: null, gif_url: null, instructions: null, instruction_steps: null }

// jsdom has no `IntersectionObserver` — this stand-in captures each
// observer's callback so a test can call it directly to simulate the
// infinite-scroll sentinel coming into view (see the "fetches the next
// page" test below).
class MockIntersectionObserver implements Pick<IntersectionObserver, 'observe' | 'unobserve' | 'disconnect' | 'takeRecords'> {
  static instances: MockIntersectionObserver[] = []
  callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

function defaultSearchResult() {
  return {
    data: { pages: [[benchPress]] },
    isLoading: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }
}

describe('ExercisePicker', () => {
  beforeEach(() => {
    useExerciseSearchQuery.mockReset()
    useRelatedExercisesQuery.mockReset()
    useExerciseQuery.mockReset()
    useExerciseSearchQuery.mockReturnValue(defaultSearchResult())
    useRelatedExercisesQuery.mockReturnValue({ data: [], isLoading: false })
    useExerciseQuery.mockReturnValue({ data: undefined, isLoading: false })
    MockIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
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

    // "Categoría" and "Parte del cuerpo" share the same real chip values
    // (see `exercise-filter-options.ts`), so `within` scopes the query to
    // the "Categoría" section specifically.
    const categorySection = screen.getByText('Categoría').closest('div') as HTMLElement
    const chip = within(categorySection).getByRole('button', { name: 'chest' })
    fireEvent.click(chip)
    expect(useExerciseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'chest' }))

    fireEvent.click(chip)
    expect(useExerciseSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ category: undefined }))
  })

  it('fetches the next page when the infinite-scroll sentinel comes into view', () => {
    const fetchNextPage = vi.fn()
    useExerciseSearchQuery.mockReturnValue({
      ...defaultSearchResult(),
      hasNextPage: true,
      fetchNextPage,
    })

    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={vi.fn()} />)

    const [observer] = MockIntersectionObserver.instances
    expect(observer).toBeDefined()
    act(() => {
      observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer as unknown as IntersectionObserver)
    })

    expect(fetchNextPage).toHaveBeenCalled()
  })

  it('does not observe a sentinel when there is no next page', () => {
    renderPicker(<ExercisePicker open onClose={vi.fn()} onSelect={vi.fn()} />)
    expect(MockIntersectionObserver.instances).toHaveLength(0)
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
