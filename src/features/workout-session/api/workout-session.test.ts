import { beforeEach, describe, expect, it, vi } from 'vitest'

// Same minimal chainable Supabase query-builder mock used by
// `features/routines/api/routines.test.ts`, extended with `maybeSingle`/`limit`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

const from = vi.fn()
const rpc = vi.fn()
const getUser = vi.fn()

vi.mock('../../../shared/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    rpc: (...args: unknown[]) => rpc(...args),
    auth: { getUser: (...args: unknown[]) => getUser(...args) },
  },
}))

import {
  addWorkoutExercise,
  deleteSet,
  discardWorkout,
  finishWorkout,
  getLastLoggedWeight,
  getPreviousSessionSets,
  getUserEquipment,
  logSet,
  removeWorkoutExercise,
  replaceWorkoutExercise,
  resumeActiveWorkout,
  startWorkout,
  toggleCompleted,
  updateSet,
} from './workout-session'
import { getUserEquipment as canonicalGetUserEquipment } from '../../equipment/api/equipment'

beforeEach(() => {
  from.mockReset()
  rpc.mockReset()
  getUser.mockReset()
})

describe('startWorkout', () => {
  it('creates a freestyle workout (no routine) without touching workout_exercises', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const workoutBuilder = makeQueryBuilder({
      data: { id: 'workout-1', routine_id: null, notes: null, created_at: '2026-01-01', finished_at: null },
      error: null,
    })
    from.mockReturnValue(workoutBuilder)

    const result = await startWorkout(null)

    expect(from).toHaveBeenCalledWith('workouts')
    expect(workoutBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-1', routine_id: null })
    expect(from).toHaveBeenCalledTimes(1)
    expect(result.id).toBe('workout-1')
  })

  it('creates a workout from a routine and pre-populates workout_exercises in routine order', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const workoutBuilder = makeQueryBuilder({
      data: { id: 'workout-1', routine_id: 'routine-1', notes: null, created_at: '2026-01-01', finished_at: null },
      error: null,
    })
    const routineExercisesBuilder = makeQueryBuilder({
      data: [
        { exercise_id: 'ex-a', position: 0 },
        { exercise_id: 'ex-b', position: 1 },
      ],
      error: null,
    })
    const workoutExercisesBuilder = makeQueryBuilder({ data: null, error: null })

    from.mockImplementation((table: string) => {
      if (table === 'workouts') return workoutBuilder
      if (table === 'routine_exercises') return routineExercisesBuilder
      return workoutExercisesBuilder
    })

    await startWorkout('routine-1')

    expect(workoutBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-1', routine_id: 'routine-1' })
    expect(routineExercisesBuilder.eq).toHaveBeenCalledWith('routine_id', 'routine-1')
    expect(workoutExercisesBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ workout_id: 'workout-1', exercise_id: 'ex-a', position: 0, user_id: 'user-1' }),
      expect.objectContaining({ workout_id: 'workout-1', exercise_id: 'ex-b', position: 1, user_id: 'user-1' }),
    ])
  })

  it('pre-fills set rows from the routine targets and the previous session of each exercise', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const workoutBuilder = makeQueryBuilder({
      data: { id: 'workout-1', routine_id: 'routine-1', notes: null, created_at: '2026-01-01', finished_at: null },
      error: null,
    })
    const routineExercisesBuilder = makeQueryBuilder({
      data: [
        { exercise_id: 'ex-a', position: 0, target_sets: 2, target_reps: '8-10' },
        { exercise_id: 'ex-b', position: 1, target_sets: 1, target_reps: null },
      ],
      error: null,
    })
    const workoutExercisesBuilder = makeQueryBuilder({
      data: [
        { id: 'we-a', exercise_id: 'ex-a', position: 0 },
        { id: 'we-b', exercise_id: 'ex-b', position: 1 },
      ],
      error: null,
    })
    const setEntriesBuilder = makeQueryBuilder({ data: null, error: null })

    from.mockImplementation((table: string) => {
      if (table === 'workouts') return workoutBuilder
      if (table === 'routine_exercises') return routineExercisesBuilder
      if (table === 'workout_exercises') return workoutExercisesBuilder
      return setEntriesBuilder
    })
    rpc.mockImplementation((_name: string, args: { p_exercise_id: string }) =>
      Promise.resolve(
        args.p_exercise_id === 'ex-a'
          ? {
              data: [
                { workout_id: 'prev', weight: 62.5, reps: 8, completed_at: '2026-01-01T10:05:00Z' },
                { workout_id: 'prev', weight: 60, reps: 10, completed_at: '2026-01-01T10:00:00Z' },
              ],
              error: null,
            }
          : { data: [], error: null },
      ),
    )

    await startWorkout('routine-1')

    expect(rpc).toHaveBeenCalledWith('countable_sets', { p_exercise_id: 'ex-a' })
    expect(rpc).toHaveBeenCalledWith('countable_sets', { p_exercise_id: 'ex-b' })
    const base = { workout_id: 'workout-1', user_id: 'user-1', tag: 'normal', completed: false }
    expect(setEntriesBuilder.insert).toHaveBeenCalledWith([
      { ...base, workout_exercise_id: 'we-a', exercise_id: 'ex-a', weight: 60, reps: 8 },
      { ...base, workout_exercise_id: 'we-a', exercise_id: 'ex-a', weight: 62.5, reps: 8 },
      { ...base, workout_exercise_id: 'we-b', exercise_id: 'ex-b', weight: 0, reps: 8 },
    ])
  })

  it('still pre-fills rows (with an empty weight) when the history lookup fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })

    const workoutBuilder = makeQueryBuilder({
      data: { id: 'workout-1', routine_id: 'routine-1', notes: null, created_at: '2026-01-01', finished_at: null },
      error: null,
    })
    const routineExercisesBuilder = makeQueryBuilder({
      data: [{ exercise_id: 'ex-a', position: 0, target_sets: 1, target_reps: '5' }],
      error: null,
    })
    const workoutExercisesBuilder = makeQueryBuilder({
      data: [{ id: 'we-a', exercise_id: 'ex-a', position: 0 }],
      error: null,
    })
    const setEntriesBuilder = makeQueryBuilder({ data: null, error: null })

    from.mockImplementation((table: string) => {
      if (table === 'workouts') return workoutBuilder
      if (table === 'routine_exercises') return routineExercisesBuilder
      if (table === 'workout_exercises') return workoutExercisesBuilder
      return setEntriesBuilder
    })
    rpc.mockResolvedValue({ data: null, error: { message: 'rpc down' } })

    await startWorkout('routine-1')

    expect(setEntriesBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ workout_exercise_id: 'we-a', weight: 0, reps: 5 }),
    ])
  })

  it('throws when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(startWorkout(null)).rejects.toThrow('Not authenticated')
    expect(from).not.toHaveBeenCalled()
  })
})

describe('resumeActiveWorkout', () => {
  it('returns the active (finished_at IS NULL) workout when one exists', async () => {
    const builder = makeQueryBuilder({
      data: { id: 'workout-1', routine_id: null, notes: null, created_at: '2026-01-01', finished_at: null },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await resumeActiveWorkout()

    expect(from).toHaveBeenCalledWith('workouts')
    expect(builder.is).toHaveBeenCalledWith('finished_at', null)
    expect(result?.id).toBe('workout-1')
  })

  it('returns null when there is no active workout', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await resumeActiveWorkout()).toBeNull()
  })
})

describe('addWorkoutExercise', () => {
  it('inserts a new workout_exercises row at the given position', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const builder = makeQueryBuilder({
      data: { id: 'we-1', workout_id: 'workout-1', exercise_id: 'ex-c', position: 2 },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await addWorkoutExercise('workout-1', 'ex-c', 2)

    expect(builder.insert).toHaveBeenCalledWith({
      workout_id: 'workout-1',
      exercise_id: 'ex-c',
      position: 2,
      user_id: 'user-1',
    })
    expect(result.id).toBe('we-1')
  })
})

describe('logSet', () => {
  it('inserts a new set_entries row', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const builder = makeQueryBuilder({
      data: {
        id: 'set-1',
        workout_exercise_id: 'we-1',
        workout_id: 'workout-1',
        exercise_id: 'ex-a',
        weight: 100,
        reps: 8,
        tag: 'normal',
        completed: false,
        completed_at: null,
      },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await logSet({
      workoutExerciseId: 'we-1',
      workoutId: 'workout-1',
      exerciseId: 'ex-a',
      weight: 100,
      reps: 8,
      tag: 'normal',
    })

    expect(from).toHaveBeenCalledWith('set_entries')
    expect(builder.insert).toHaveBeenCalledWith({
      workout_exercise_id: 'we-1',
      workout_id: 'workout-1',
      exercise_id: 'ex-a',
      weight: 100,
      reps: 8,
      tag: 'normal',
      completed: false,
      user_id: 'user-1',
    })
    expect(result.id).toBe('set-1')
  })
})

describe('updateSet', () => {
  it('updates only the provided fields by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await updateSet('set-1', { weight: 105, reps: 6 })

    expect(from).toHaveBeenCalledWith('set_entries')
    expect(builder.update).toHaveBeenCalledWith({ weight: 105, reps: 6 })
    expect(builder.eq).toHaveBeenCalledWith('id', 'set-1')
  })
})

describe('toggleCompleted', () => {
  it('sets completed=true with a completed_at timestamp', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await toggleCompleted('set-1', true)

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ completed: true, completed_at: expect.any(String) }),
    )
  })

  it('sets completed=false with a null completed_at', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await toggleCompleted('set-1', false)

    expect(builder.update).toHaveBeenCalledWith({ completed: false, completed_at: null })
  })
})

describe('finishWorkout', () => {
  it('sets finished_at to now on the given workout', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await finishWorkout('workout-1')

    expect(from).toHaveBeenCalledWith('workouts')
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ finished_at: expect.any(String) }))
    expect(builder.eq).toHaveBeenCalledWith('id', 'workout-1')
  })
})

describe('getLastLoggedWeight', () => {
  it('calls the countable_sets RPC and returns the most recent weight excluding the current workout', async () => {
    rpc.mockResolvedValue({
      data: [
        { id: 's1', workout_id: 'workout-current', weight: 999, completed_at: '2026-02-01T00:00:00Z' },
        { id: 's2', workout_id: 'workout-old', weight: 90, completed_at: '2026-01-01T00:00:00Z' },
        { id: 's3', workout_id: 'workout-older', weight: 80, completed_at: '2025-12-01T00:00:00Z' },
      ],
      error: null,
    })

    const result = await getLastLoggedWeight('ex-a', 'workout-current')

    expect(rpc).toHaveBeenCalledWith('countable_sets', { p_exercise_id: 'ex-a' })
    expect(result).toBe(90)
  })

  it('returns null when there are no prior countable sets', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    expect(await getLastLoggedWeight('ex-a', 'workout-current')).toBeNull()
  })
})

// Full behavior coverage for `getUserEquipment` (row exists / no row yet /
// unexpected query error) now lives in
// `features/equipment/api/equipment.test.ts`, the canonical implementation's
// test file — this only confirms the re-export from here still resolves to
// that exact same function, so `use-workout-session.ts` and
// `plate-calculator.tsx` keep working unchanged.
describe('deleteSet', () => {
  it('deletes the set_entries row by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await deleteSet('set-1')

    expect(from).toHaveBeenCalledWith('set_entries')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'set-1')
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: new Error('nope') }))
    await expect(deleteSet('set-1')).rejects.toThrow('nope')
  })
})

describe('discardWorkout', () => {
  it('deletes the workout only while it is still unfinished', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await discardWorkout('workout-1')

    expect(from).toHaveBeenCalledWith('workouts')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'workout-1')
    expect(builder.is).toHaveBeenCalledWith('finished_at', null)
  })

  it('throws when the delete fails', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: new Error('nope') }))
    await expect(discardWorkout('workout-1')).rejects.toThrow('nope')
  })
})

describe('removeWorkoutExercise', () => {
  it('deletes the workout_exercises row by id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null })
    from.mockReturnValue(builder)

    await removeWorkoutExercise('we-1')

    expect(from).toHaveBeenCalledWith('workout_exercises')
    expect(builder.delete).toHaveBeenCalled()
    expect(builder.eq).toHaveBeenCalledWith('id', 'we-1')
  })
})

describe('replaceWorkoutExercise', () => {
  function setup() {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const workoutExercisesBuilder = makeQueryBuilder({
      data: { id: 'we-new', workout_id: 'workout-1', exercise_id: 'ex-new', position: 1 },
      error: null,
    })
    const setEntriesBuilder = makeQueryBuilder({ data: null, error: null })
    from.mockImplementation((table: string) =>
      table === 'workout_exercises' ? workoutExercisesBuilder : setEntriesBuilder,
    )
    rpc.mockResolvedValue({ data: [], error: null })
    return { workoutExercisesBuilder, setEntriesBuilder }
  }

  it('removes the original and inserts the replacement in its slot with pre-filled sets', async () => {
    const { workoutExercisesBuilder, setEntriesBuilder } = setup()

    await replaceWorkoutExercise({
      workoutId: 'workout-1',
      workoutExerciseId: 'we-1',
      newExerciseId: 'ex-new',
      plan: { removeOriginal: true, insertPosition: 1, shifts: [], setCount: 2, reps: 10 },
    })

    expect(workoutExercisesBuilder.delete).toHaveBeenCalled()
    expect(workoutExercisesBuilder.eq).toHaveBeenCalledWith('id', 'we-1')
    expect(workoutExercisesBuilder.insert).toHaveBeenCalledWith({
      workout_id: 'workout-1',
      exercise_id: 'ex-new',
      position: 1,
      user_id: 'user-1',
    })
    expect(setEntriesBuilder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ workout_exercise_id: 'we-new', exercise_id: 'ex-new', weight: 0, reps: 10 }),
      expect.objectContaining({ workout_exercise_id: 'we-new', exercise_id: 'ex-new', weight: 0, reps: 10 }),
    ])
  })

  it('keeps the original and shifts later exercises when the plan says so', async () => {
    const { workoutExercisesBuilder } = setup()

    await replaceWorkoutExercise({
      workoutId: 'workout-1',
      workoutExerciseId: 'we-1',
      newExerciseId: 'ex-new',
      plan: {
        removeOriginal: false,
        insertPosition: 2,
        shifts: [{ id: 'we-2', position: 3 }],
        setCount: 0,
        reps: null,
      },
    })

    expect(workoutExercisesBuilder.delete).not.toHaveBeenCalled()
    expect(workoutExercisesBuilder.update).toHaveBeenCalledWith({ position: 3 })
    expect(workoutExercisesBuilder.eq).toHaveBeenCalledWith('id', 'we-2')
    expect(workoutExercisesBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ position: 2 }))
  })
})

describe('getPreviousSessionSets', () => {
  it('returns the sets of the most recent other workout, oldest first', async () => {
    rpc.mockResolvedValue({
      data: [
        { workout_id: 'current', weight: 70, reps: 5, completed_at: '2026-02-01T10:00:00Z' },
        { workout_id: 'prev', weight: 62.5, reps: 8, completed_at: '2026-01-08T10:05:00Z' },
        { workout_id: 'prev', weight: 60, reps: 10, completed_at: '2026-01-08T10:00:00Z' },
        { workout_id: 'older', weight: 50, reps: 10, completed_at: '2026-01-01T10:00:00Z' },
      ],
      error: null,
    })

    const result = await getPreviousSessionSets('ex-a', 'current')

    expect(rpc).toHaveBeenCalledWith('countable_sets', { p_exercise_id: 'ex-a' })
    expect(result).toEqual([
      { weight: 60, reps: 10 },
      { weight: 62.5, reps: 8 },
    ])
  })

  it('throws when the RPC fails', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('rpc down') })
    await expect(getPreviousSessionSets('ex-a', 'current')).rejects.toThrow('rpc down')
  })
})

describe('getUserEquipment (re-export)', () => {
  it('re-exports the canonical implementation from the equipment feature', () => {
    expect(getUserEquipment).toBe(canonicalGetUserEquipment)
  })
})
