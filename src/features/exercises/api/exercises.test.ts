import { beforeEach, describe, expect, it, vi } from 'vitest'

// Same minimal chainable Supabase query-builder mock used by
// `features/routines/api/routines.test.ts`, extended with `ilike`/`neq`/`limit`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    not: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    in: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

const from = vi.fn()

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
  },
}))

import type { Exercise } from './exercises'
import {
  SEARCH_PAGE_SIZE,
  fetchExerciseById,
  fetchExerciseFocus,
  fetchExercisesByIds,
  fetchRelatedExercises,
  fetchSimilarExercises,
  searchExercises,
} from './exercises'

describe('searchExercises', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries the exercises table with no filters by default', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'ex-1', name: 'Bench Press' }], error: null })
    from.mockReturnValue(builder)

    const result = await searchExercises()

    expect(from).toHaveBeenCalledWith('exercises')
    expect(builder.ilike).not.toHaveBeenCalled()
    expect(builder.eq).not.toHaveBeenCalled()
    expect(result).toEqual({ exercises: [{ id: 'ex-1', name: 'Bench Press' }], hasMore: false })
  })

  it('applies a name ilike filter when name is provided', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ name: 'bench' })

    expect(builder.ilike).toHaveBeenCalledWith('name', '%bench%')
  })

  it('ignores a blank name filter', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ name: '   ' })

    expect(builder.ilike).not.toHaveBeenCalled()
  })

  it('combines category, bodyPart and equipment filters', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ category: 'strength', bodyPart: 'chest', equipment: 'barbell' })

    expect(builder.eq).toHaveBeenCalledWith('category', 'strength')
    expect(builder.eq).toHaveBeenCalledWith('body_part', 'chest')
    expect(builder.eq).toHaveBeenCalledWith('equipment', 'barbell')
  })

  it('uses an `in` filter when equipment is an array of raw values (category filtering)', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ equipment: ['dumbbell', 'barbell'] })

    expect(builder.in).toHaveBeenCalledWith('equipment', ['dumbbell', 'barbell'])
    expect(builder.eq).not.toHaveBeenCalledWith('equipment', expect.anything())
  })

  it('returns an empty array when data is null', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))

    expect(await searchExercises()).toEqual({ exercises: [], hasMore: false })
  })

  it('propagates a query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'query failed' } }))

    await expect(searchExercises()).rejects.toEqual({ message: 'query failed' })
  })

  it('reports hasMore when the main query returned a full page', async () => {
    const fullPage = Array.from({ length: SEARCH_PAGE_SIZE }, (_, index) => ({ id: `ex-${index}`, name: `Ex ${index}` }))
    from.mockReturnValue(makeQueryBuilder({ data: fullPage, error: null }))

    expect((await searchExercises({}, 1)).hasMore).toBe(true)
  })

  it('escapes % and _ in the typed name', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ name: '50%_x' }, 1)

    expect(builder.ilike).toHaveBeenCalledWith('name', '%50\\%\\_x%')
  })

  it('on page 0 with a name, puts exact case-insensitive matches first and excludes them from the paged query', async () => {
    const mainBuilder = makeQueryBuilder({ data: [{ id: 'ex-2', name: 'Run Fast' }], error: null })
    const exactBuilder = makeQueryBuilder({ data: [{ id: 'ex-1', name: 'Run' }], error: null })
    from.mockReturnValueOnce(mainBuilder).mockReturnValueOnce(exactBuilder)

    const result = await searchExercises({ name: 'run', bodyPart: 'cardio' })

    expect(mainBuilder.ilike).toHaveBeenCalledWith('name', '%run%')
    expect(mainBuilder.not).toHaveBeenCalledWith('name', 'ilike', 'run')
    expect(exactBuilder.ilike).toHaveBeenCalledWith('name', 'run')
    expect(exactBuilder.eq).toHaveBeenCalledWith('body_part', 'cardio')
    expect(result).toEqual({
      exercises: [
        { id: 'ex-1', name: 'Run' },
        { id: 'ex-2', name: 'Run Fast' },
      ],
      hasMore: false,
    })
  })

  it('dedupes an exact match that also came back from the paged query', async () => {
    const mainBuilder = makeQueryBuilder({ data: [{ id: 'ex-1', name: 'Run' }], error: null })
    const exactBuilder = makeQueryBuilder({ data: [{ id: 'ex-1', name: 'Run' }], error: null })
    from.mockReturnValueOnce(mainBuilder).mockReturnValueOnce(exactBuilder)

    const result = await searchExercises({ name: 'run' })

    expect(result.exercises).toEqual([{ id: 'ex-1', name: 'Run' }])
  })

  it('bases hasMore on the paged query only, not on the extra exact matches', async () => {
    const page = Array.from({ length: SEARCH_PAGE_SIZE - 1 }, (_, index) => ({ id: `ex-${index}`, name: `Run ${index}` }))
    from
      .mockReturnValueOnce(makeQueryBuilder({ data: page, error: null }))
      .mockReturnValueOnce(makeQueryBuilder({ data: [{ id: 'exact', name: 'Run' }], error: null }))

    const result = await searchExercises({ name: 'run' })

    expect(result.exercises).toHaveLength(SEARCH_PAGE_SIZE)
    expect(result.hasMore).toBe(false)
  })

  it('does not run the exact-match query on later pages, but still excludes exact matches', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({ name: 'run' }, 1)

    expect(from).toHaveBeenCalledTimes(1)
    expect(builder.not).toHaveBeenCalledWith('name', 'ilike', 'run')
  })

  it('ranges over the first page by default', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises()

    expect(builder.range).toHaveBeenCalledWith(0, SEARCH_PAGE_SIZE - 1)
  })

  it('ranges over a later page', async () => {
    const builder = makeQueryBuilder({ data: [], error: null })
    from.mockReturnValue(builder)

    await searchExercises({}, 2)

    expect(builder.range).toHaveBeenCalledWith(2 * SEARCH_PAGE_SIZE, 3 * SEARCH_PAGE_SIZE - 1)
  })
})

describe('fetchRelatedExercises', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries by target excluding the current exercise id, limited to 6', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'ex-2', name: 'Incline Press' }], error: null })
    from.mockReturnValue(builder)

    const result = await fetchRelatedExercises('chest', 'ex-1')

    expect(from).toHaveBeenCalledWith('exercises')
    expect(builder.eq).toHaveBeenCalledWith('target', 'chest')
    expect(builder.eq).not.toHaveBeenCalledWith('muscle_group', expect.anything())
    expect(builder.neq).toHaveBeenCalledWith('id', 'ex-1')
    expect(builder.limit).toHaveBeenCalledWith(6)
    expect(result).toEqual([{ id: 'ex-2', name: 'Incline Press' }])
  })

  it('returns an empty array when data is null', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))

    expect(await fetchRelatedExercises('chest', 'ex-1')).toEqual([])
  })
})

describe('fetchExerciseById', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries the exercises table by id', async () => {
    const builder = makeQueryBuilder({ data: { id: 'ex-1', name: 'Bench Press' }, error: null })
    from.mockReturnValue(builder)

    const result = await fetchExerciseById('ex-1')

    expect(from).toHaveBeenCalledWith('exercises')
    expect(builder.eq).toHaveBeenCalledWith('id', 'ex-1')
    expect(result).toEqual({ id: 'ex-1', name: 'Bench Press' })
  })

  it('returns null when no exercise matches the id', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await fetchExerciseById('missing')).toBeNull()
  })
})

describe('fetchExercisesByIds', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries the exercises table with an `in` filter over the given ids', async () => {
    const builder = makeQueryBuilder({
      data: [
        { id: 'ex-1', name: 'Bench Press' },
        { id: 'ex-2', name: 'Squat' },
      ],
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await fetchExercisesByIds(['ex-1', 'ex-2'])

    expect(from).toHaveBeenCalledWith('exercises')
    expect(builder.in).toHaveBeenCalledWith('id', ['ex-1', 'ex-2'])
    expect(result).toEqual([
      { id: 'ex-1', name: 'Bench Press' },
      { id: 'ex-2', name: 'Squat' },
    ])
  })

  it('returns an empty array without querying when given an empty id list', async () => {
    const result = await fetchExercisesByIds([])

    expect(from).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('returns an empty array when data is null', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await fetchExercisesByIds(['ex-1'])).toEqual([])
  })
})

describe('fetchExerciseFocus', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries exercise_focus by exercise id and returns the focus row', async () => {
    const builder = makeQueryBuilder({
      data: { focus: 'lateral_deltoid', confidence: 'high', is_stretch: false },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await fetchExerciseFocus('ex-1')

    expect(from).toHaveBeenCalledWith('exercise_focus')
    expect(builder.eq).toHaveBeenCalledWith('exercise_id', 'ex-1')
    expect(builder.maybeSingle).toHaveBeenCalled()
    expect(result).toEqual({ focus: 'lateral_deltoid', confidence: 'high', is_stretch: false })
  })

  it('returns null when the exercise has no focus row', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await fetchExerciseFocus('ex-1')).toBeNull()
  })

  it('propagates a query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'relation does not exist' } }))
    await expect(fetchExerciseFocus('ex-1')).rejects.toEqual({ message: 'relation does not exist' })
  })
})

describe('fetchSimilarExercises', () => {
  const current: Exercise = {
    id: 'cur',
    name: 'Lateral Raise',
    category: null,
    body_part: 'shoulders',
    equipment: 'dumbbell',
    target: 'delts',
    muscle_group: null,
    secondary_muscles: null,
    image: null,
    gif_url: null,
    instructions: null,
    instruction_steps: null,
  }

  beforeEach(() => {
    from.mockReset()
  })

  it('ranks same-focus exercises first and fills from same-target', async () => {
    const focusRow = makeQueryBuilder({
      data: { focus: 'lateral_deltoid', confidence: 'high', is_stretch: false },
      error: null,
    })
    const focusCandidates = makeQueryBuilder({
      data: [
        { focus: 'lateral_deltoid', confidence: 'high', is_stretch: false, exercises: { id: 'f1', name: 'Cable Raise' } },
        { focus: 'lateral_deltoid', confidence: 'low', is_stretch: false, exercises: { id: 'f2', name: 'Low' } },
      ],
      error: null,
    })
    const targetCandidates = makeQueryBuilder({
      data: [
        { id: 'f1', name: 'Cable Raise' },
        { id: 't1', name: 'Overhead Press' },
      ],
      error: null,
    })
    from
      .mockReturnValueOnce(focusRow)
      .mockReturnValueOnce(focusCandidates)
      .mockReturnValueOnce(targetCandidates)

    const result = await fetchSimilarExercises(current)

    expect(from).toHaveBeenNthCalledWith(1, 'exercise_focus')
    expect(from).toHaveBeenNthCalledWith(2, 'exercise_focus')
    expect(from).toHaveBeenNthCalledWith(3, 'exercises')
    expect(focusCandidates.eq).toHaveBeenCalledWith('focus', 'lateral_deltoid')
    expect(focusCandidates.neq).toHaveBeenCalledWith('exercise_id', 'cur')
    expect(focusCandidates.limit).toHaveBeenCalledWith(12)
    expect(targetCandidates.eq).toHaveBeenCalledWith('target', 'delts')
    expect(targetCandidates.neq).toHaveBeenCalledWith('id', 'cur')
    expect(targetCandidates.limit).toHaveBeenCalledWith(12)
    expect(result).toEqual([
      { exercise: { id: 'f1', name: 'Cable Raise' }, focus: 'lateral_deltoid' },
      { exercise: { id: 't1', name: 'Overhead Press' }, focus: null },
    ])
  })

  it('uses only same-target exercises when the current exercise has no focus', async () => {
    const targetCandidates = makeQueryBuilder({ data: [{ id: 't1', name: 'Overhead Press' }], error: null })
    from.mockReturnValueOnce(makeQueryBuilder({ data: null, error: null })).mockReturnValueOnce(targetCandidates)

    const result = await fetchSimilarExercises(current)

    expect(from).toHaveBeenCalledTimes(2)
    expect(from).toHaveBeenLastCalledWith('exercises')
    expect(result).toEqual([{ exercise: { id: 't1', name: 'Overhead Press' }, focus: null }])
  })

  it('degrades to same-target results when the focus table is unavailable', async () => {
    const targetCandidates = makeQueryBuilder({ data: [{ id: 't1', name: 'Overhead Press' }], error: null })
    from
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: { code: '42P01', message: 'relation does not exist' } }))
      .mockReturnValueOnce(targetCandidates)

    const result = await fetchSimilarExercises(current)

    expect(result).toEqual([{ exercise: { id: 't1', name: 'Overhead Press' }, focus: null }])
  })

  it('degrades to same-target results when the same-focus query errors', async () => {
    from
      .mockReturnValueOnce(
        makeQueryBuilder({ data: { focus: 'lateral_deltoid', confidence: 'high', is_stretch: false }, error: null }),
      )
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: { message: 'boom' } }))
      .mockReturnValueOnce(makeQueryBuilder({ data: [{ id: 't1', name: 'Overhead Press' }], error: null }))

    const result = await fetchSimilarExercises(current)

    expect(result).toEqual([{ exercise: { id: 't1', name: 'Overhead Press' }, focus: null }])
  })

  it('skips the target query when the exercise has no target', async () => {
    from.mockReturnValueOnce(makeQueryBuilder({ data: null, error: null }))

    const result = await fetchSimilarExercises({ ...current, target: null })

    expect(from).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })

  it('propagates a target query error', async () => {
    from
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: null }))
      .mockReturnValueOnce(makeQueryBuilder({ data: null, error: { message: 'target failed' } }))

    await expect(fetchSimilarExercises(current)).rejects.toEqual({ message: 'target failed' })
  })
})
