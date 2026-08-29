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
  finishWorkout,
  getLastLoggedWeight,
  getUserEquipment,
  logSet,
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
describe('getUserEquipment (re-export)', () => {
  it('re-exports the canonical implementation from the equipment feature', () => {
    expect(getUserEquipment).toBe(canonicalGetUserEquipment)
  })
})
