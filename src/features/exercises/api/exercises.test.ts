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
    limit: vi.fn(() => builder),
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

import { fetchExerciseById, fetchExercisesByIds, fetchRelatedExercises, searchExercises } from './exercises'

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
    expect(result).toEqual([{ id: 'ex-1', name: 'Bench Press' }])
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

    expect(await searchExercises()).toEqual([])
  })

  it('propagates a query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'query failed' } }))

    await expect(searchExercises()).rejects.toEqual({ message: 'query failed' })
  })
})

describe('fetchRelatedExercises', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('queries by muscle_group excluding the current exercise id, limited to 6', async () => {
    const builder = makeQueryBuilder({ data: [{ id: 'ex-2', name: 'Incline Press' }], error: null })
    from.mockReturnValue(builder)

    const result = await fetchRelatedExercises('chest', 'ex-1')

    expect(from).toHaveBeenCalledWith('exercises')
    expect(builder.eq).toHaveBeenCalledWith('muscle_group', 'chest')
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
