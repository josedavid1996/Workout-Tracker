import { beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal chainable Supabase query-builder mock: every chain method returns
// `this` so calls can be composed in any order the implementation needs,
// and the whole thing is thenable so `await` on the builder itself (without
// an explicit `.single()`) resolves to `result`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

const from = vi.fn()
const getUser = vi.fn()

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    auth: { getUser: (...args: unknown[]) => getUser(...args) },
  },
}))

import { createRoutine, deleteRoutine, fetchRoutinesWithExercises, updateRoutine } from './routines'

describe('createRoutine', () => {
  beforeEach(() => {
    from.mockReset()
    getUser.mockReset()
  })

  it('inserts the routine, then inserts routine_exercises with recomputed positions', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const routineBuilder = makeQueryBuilder({
      data: { id: 'routine-1', name: 'Push day', created_at: '2026-01-01' },
      error: null,
    })
    const exercisesBuilder = makeQueryBuilder({ data: null, error: null })
    from.mockImplementation((table: string) => (table === 'routines' ? routineBuilder : exercisesBuilder))

    const result = await createRoutine('Push day', [
      { exerciseId: 'ex-a', targetSets: 3, targetReps: '8-10' },
      { exerciseId: 'ex-b', targetSets: null, targetReps: null },
    ])

    expect(from).toHaveBeenCalledWith('routines')
    expect(routineBuilder.insert).toHaveBeenCalledWith({ name: 'Push day', user_id: 'user-1' })

    expect(from).toHaveBeenCalledWith('routine_exercises')
    expect(exercisesBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ exercise_id: 'ex-a', position: 0, routine_id: 'routine-1', user_id: 'user-1' }),
      expect.objectContaining({ exercise_id: 'ex-b', position: 1, routine_id: 'routine-1', user_id: 'user-1' }),
    ])

    expect(result).toEqual({ id: 'routine-1', name: 'Push day', created_at: '2026-01-01' })
  })

  it('does not insert routine_exercises when the exercise list is empty', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const routineBuilder = makeQueryBuilder({
      data: { id: 'routine-1', name: 'Push day', created_at: '2026-01-01' },
      error: null,
    })
    from.mockReturnValue(routineBuilder)

    await createRoutine('Push day', [])

    expect(from).toHaveBeenCalledTimes(1)
    expect(from).toHaveBeenCalledWith('routines')
  })

  it('throws when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(createRoutine('Push day', [])).rejects.toThrow('Not authenticated')
    expect(from).not.toHaveBeenCalled()
  })

  it('propagates a routine insert error', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'insert failed' } }))

    await expect(createRoutine('Push day', [])).rejects.toEqual({ message: 'insert failed' })
  })
})

describe('updateRoutine', () => {
  beforeEach(() => {
    from.mockReset()
    getUser.mockReset()
  })

  it('renames, deletes existing routine_exercises, then reinserts the new list', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const renameBuilder = makeQueryBuilder({ data: null, error: null })
    const deleteBuilder = makeQueryBuilder({ data: null, error: null })
    const insertBuilder = makeQueryBuilder({ data: null, error: null })
    const calls: string[] = []

    from.mockImplementation((table: string) => {
      calls.push(table)
      if (table === 'routines') return renameBuilder
      if (calls.filter((t) => t === 'routine_exercises').length === 1) return deleteBuilder
      return insertBuilder
    })

    await updateRoutine('routine-1', 'New name', [{ exerciseId: 'ex-a', targetSets: 4, targetReps: '5' }])

    expect(renameBuilder.update).toHaveBeenCalledWith({ name: 'New name' })
    expect(renameBuilder.eq).toHaveBeenCalledWith('id', 'routine-1')
    expect(deleteBuilder.delete).toHaveBeenCalled()
    expect(deleteBuilder.eq).toHaveBeenCalledWith('routine_id', 'routine-1')
    expect(insertBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ exercise_id: 'ex-a', position: 0, routine_id: 'routine-1', user_id: 'user-1' }),
    ])
  })

  it('throws when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(updateRoutine('routine-1', 'New name', [])).rejects.toThrow('Not authenticated')
  })
})

describe('deleteRoutine', () => {
  it('deletes the routine by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await deleteRoutine('routine-1')

    expect(from).toHaveBeenCalledWith('routines')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'routine-1')
  })

  it('throws on a delete error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'delete failed' } }))

    await expect(deleteRoutine('routine-1')).rejects.toEqual({ message: 'delete failed' })
  })
})

describe('fetchRoutinesWithExercises', () => {
  beforeEach(() => {
    from.mockReset()
  })

  it('fetches every routine newest-first with nested routine_exercises ordered by position', async () => {
    const builder = makeQueryBuilder({
      data: [
        {
          id: 'routine-1',
          name: 'Push day',
          created_at: '2026-01-02',
          routine_exercises: [{ id: 're-1', routine_id: 'routine-1', exercise_id: 'ex-a', position: 0, target_sets: 3, target_reps: '8-10' }],
        },
      ],
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await fetchRoutinesWithExercises()

    expect(from).toHaveBeenCalledWith('routines')
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(builder.order).toHaveBeenCalledWith('position', {
      referencedTable: 'routine_exercises',
      ascending: true,
    })
    expect(result[0].routine_exercises).toHaveLength(1)
  })

  it('returns an empty array when data is null', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await fetchRoutinesWithExercises()).toEqual([])
  })

  it('propagates a query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'query failed' } }))
    await expect(fetchRoutinesWithExercises()).rejects.toEqual({ message: 'query failed' })
  })
})
