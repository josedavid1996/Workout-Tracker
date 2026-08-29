import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Cleanup, TestUser } from './setup'
import { createTestUser, runCleanup } from './setup'

// RLS + schema-constraint integration tests against the REAL Supabase
// instance (Phase 11 of the SDD tasks artifact). Never run as part of
// `npm run test` — see `supabase/tests/README.md` and `npm run test:rls`.
describe('RLS integration (real instance)', () => {
  let userA: TestUser
  let userB: TestUser
  let exerciseId: string
  const cleanup: Cleanup[] = []

  beforeAll(async () => {
    userA = await createTestUser('a')
    userB = await createTestUser('b')

    // A real exercise id, queried from the pre-existing `exercises` table —
    // never hardcoded (Phase 11/12 instructions: this table is out of scope
    // to modify, and its real ids are instance-specific).
    const { data: exercises, error } = await userA.client.from('exercises').select('id').limit(1)
    if (error || !exercises || exercises.length === 0) {
      throw new Error(
        `Could not fetch a real exercise id from 'exercises': ${error?.message ?? 'table is empty'}`,
      )
    }
    exerciseId = exercises[0].id as string
  }, 30000)

  afterAll(async () => {
    const failures = await runCleanup(cleanup)
    if (failures.length > 0) {
      // Documented per Phase 11.5: cleanup runs as each owning user via RLS
      // (no service-role key available in this environment), so a failure
      // here means leftover test rows remain on the instance — it never
      // fails the suite itself.
      console.warn(`RLS test cleanup left rows behind on the real instance:\n${failures.join('\n')}`)
    }
    // The test users themselves (test-a-*/test-b-*@example.com) cannot be
    // deleted with only the anon key — that needs the GoTrue admin API /a
    // service-role key, which this environment does not have. They remain
    // on the instance; see supabase/tests/README.md.
  }, 30000)

  describe('routines isolation', () => {
    it("user B cannot read, update, or delete user A's routine", async () => {
      const { data: created, error: createError } = await userA.client
        .from('routines')
        .insert({ user_id: userA.id, name: 'RLS Test Routine A' })
        .select()
        .single()
      expect(createError).toBeNull()
      cleanup.push({ table: 'routines', client: userA.client, match: { id: created!.id } })

      const { data: readByB } = await userB.client.from('routines').select('*').eq('id', created!.id)
      expect(readByB).toEqual([])

      const { data: updatedByB } = await userB.client
        .from('routines')
        .update({ name: 'Hijacked' })
        .eq('id', created!.id)
        .select()
      expect(updatedByB).toEqual([])

      const { data: deletedByB } = await userB.client.from('routines').delete().eq('id', created!.id).select()
      expect(deletedByB).toEqual([])

      const { data: stillThereForA } = await userA.client.from('routines').select('*').eq('id', created!.id)
      expect(stillThereForA).toHaveLength(1)
      expect(stillThereForA![0].name).toBe('RLS Test Routine A')
    })
  })

  describe('workouts isolation', () => {
    it("user B cannot read, update, or delete user A's workout", async () => {
      // `finished_at` is set immediately so this row never counts as this
      // user's "active" workout — that behavior is covered separately below
      // (single active workout unique index) and must stay isolated from it.
      const { data: created, error: createError } = await userA.client
        .from('workouts')
        .insert({ user_id: userA.id, routine_id: null, finished_at: new Date().toISOString() })
        .select()
        .single()
      expect(createError).toBeNull()
      cleanup.push({ table: 'workouts', client: userA.client, match: { id: created!.id } })

      const { data: readByB } = await userB.client.from('workouts').select('*').eq('id', created!.id)
      expect(readByB).toEqual([])

      const { data: updatedByB } = await userB.client
        .from('workouts')
        .update({ notes: 'hijacked' })
        .eq('id', created!.id)
        .select()
      expect(updatedByB).toEqual([])

      const { data: deletedByB } = await userB.client.from('workouts').delete().eq('id', created!.id).select()
      expect(deletedByB).toEqual([])
    })
  })

  describe('set_entries isolation', () => {
    it("user B cannot read, update, or delete user A's set entry", async () => {
      const { data: workout } = await userA.client
        .from('workouts')
        .insert({ user_id: userA.id, routine_id: null, finished_at: new Date().toISOString() })
        .select()
        .single()
      cleanup.push({ table: 'workouts', client: userA.client, match: { id: workout!.id } })

      const { data: workoutExercise } = await userA.client
        .from('workout_exercises')
        .insert({ user_id: userA.id, workout_id: workout!.id, exercise_id: exerciseId, position: 0 })
        .select()
        .single()

      const { data: set, error: setError } = await userA.client
        .from('set_entries')
        .insert({
          user_id: userA.id,
          workout_exercise_id: workoutExercise!.id,
          workout_id: workout!.id,
          exercise_id: exerciseId,
          weight: 100,
          reps: 5,
          tag: 'normal',
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()
      expect(setError).toBeNull()

      const { data: readByB } = await userB.client.from('set_entries').select('*').eq('id', set!.id)
      expect(readByB).toEqual([])

      const { data: updatedByB } = await userB.client
        .from('set_entries')
        .update({ weight: 999 })
        .eq('id', set!.id)
        .select()
      expect(updatedByB).toEqual([])

      const { data: deletedByB } = await userB.client.from('set_entries').delete().eq('id', set!.id).select()
      expect(deletedByB).toEqual([])
    })
  })

  describe('routine_exercises isolation', () => {
    it("user B cannot read user A's routine_exercises row", async () => {
      const { data: routine } = await userA.client
        .from('routines')
        .insert({ user_id: userA.id, name: 'RLS Test Routine A2' })
        .select()
        .single()
      cleanup.push({ table: 'routines', client: userA.client, match: { id: routine!.id } })

      const { data: routineExercise, error } = await userA.client
        .from('routine_exercises')
        .insert({ user_id: userA.id, routine_id: routine!.id, exercise_id: exerciseId, position: 0 })
        .select()
        .single()
      expect(error).toBeNull()

      const { data: readByB } = await userB.client
        .from('routine_exercises')
        .select('*')
        .eq('id', routineExercise!.id)
      expect(readByB).toEqual([])
    })
  })

  describe('workout_exercises isolation', () => {
    it("user B cannot read user A's workout_exercises row", async () => {
      const { data: workout } = await userA.client
        .from('workouts')
        .insert({ user_id: userA.id, routine_id: null, finished_at: new Date().toISOString() })
        .select()
        .single()
      cleanup.push({ table: 'workouts', client: userA.client, match: { id: workout!.id } })

      const { data: workoutExercise, error } = await userA.client
        .from('workout_exercises')
        .insert({ user_id: userA.id, workout_id: workout!.id, exercise_id: exerciseId, position: 0 })
        .select()
        .single()
      expect(error).toBeNull()

      const { data: readByB } = await userB.client
        .from('workout_exercises')
        .select('*')
        .eq('id', workoutExercise!.id)
      expect(readByB).toEqual([])
    })
  })

  describe('user_equipment isolation', () => {
    it("user B cannot read or overwrite user A's equipment row", async () => {
      const { error: upsertError } = await userA.client
        .from('user_equipment')
        .upsert({ user_id: userA.id, bar_weight: 25, plate_inventory: [] })
      expect(upsertError).toBeNull()
      cleanup.push({ table: 'user_equipment', client: userA.client, match: { user_id: userA.id } })

      const { data: readByB } = await userB.client.from('user_equipment').select('*').eq('user_id', userA.id)
      expect(readByB).toEqual([])

      const { data: updatedByB } = await userB.client
        .from('user_equipment')
        .update({ bar_weight: 999 })
        .eq('user_id', userA.id)
        .select()
      expect(updatedByB).toEqual([])
    })
  })

  describe('countable_sets RPC respects RLS', () => {
    it("user B calling countable_sets with A's exercise_id does not see A's sets", async () => {
      const { data: workout } = await userA.client
        .from('workouts')
        .insert({ user_id: userA.id, routine_id: null, finished_at: new Date().toISOString() })
        .select()
        .single()
      cleanup.push({ table: 'workouts', client: userA.client, match: { id: workout!.id } })

      const { data: workoutExercise } = await userA.client
        .from('workout_exercises')
        .insert({ user_id: userA.id, workout_id: workout!.id, exercise_id: exerciseId, position: 0 })
        .select()
        .single()

      const { data: set } = await userA.client
        .from('set_entries')
        .insert({
          user_id: userA.id,
          workout_exercise_id: workoutExercise!.id,
          workout_id: workout!.id,
          exercise_id: exerciseId,
          weight: 111,
          reps: 3,
          tag: 'normal',
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      const { data: rpcForA, error: rpcErrorA } = await userA.client.rpc('countable_sets', {
        p_exercise_id: exerciseId,
      })
      expect(rpcErrorA).toBeNull()
      expect(rpcForA?.some((row: { id: string }) => row.id === set!.id)).toBe(true)

      const { data: rpcForB, error: rpcErrorB } = await userB.client.rpc('countable_sets', {
        p_exercise_id: exerciseId,
      })
      expect(rpcErrorB).toBeNull()
      expect(rpcForB?.some((row: { id: string }) => row.id === set!.id)).toBe(false)
    })
  })

  describe('composite FK rejects a forged user_id', () => {
    it('rejects a routine_exercises row whose (routine_id, user_id) pair does not exist in routines', async () => {
      // A real routine that belongs to user B — used as an existing
      // routine_id, but paired below with a DIFFERENT user_id.
      const { data: routineB } = await userB.client
        .from('routines')
        .insert({ user_id: userB.id, name: 'RLS Test Routine B (FK target)' })
        .select()
        .single()
      cleanup.push({ table: 'routines', client: userB.client, match: { id: routineB!.id } })

      // Insert as user A, with `user_id: userA.id` — this passes the simple
      // RLS `with check (auth.uid() = user_id)`, since it's A's own uid —
      // but `routine_id: routineB.id` belongs to B. The composite FK
      // `(routine_id, user_id) references routines(id, user_id)` has no row
      // for `(routineB.id, userA.id)`, so Postgres must reject this as a
      // foreign key violation (23503), not an RLS denial (42501): the
      // ownership check alone is satisfied, only the composite FK isn't.
      const { error } = await userA.client.from('routine_exercises').insert({
        user_id: userA.id,
        routine_id: routineB!.id,
        exercise_id: exerciseId,
        position: 0,
      })

      expect(error).not.toBeNull()
      // Documents which of the two (FK vs. RLS) actually fires on the real
      // instance, per Phase 11.3's instructions.
      expect(error!.code).toBe('23503')
    })
  })

  describe('single active workout unique index', () => {
    it('rejects starting a second active workout while one is still unfinished', async () => {
      const { data: first, error: firstError } = await userA.client
        .from('workouts')
        .insert({ user_id: userA.id, routine_id: null })
        .select()
        .single()
      expect(firstError).toBeNull()

      try {
        const { error: secondError } = await userA.client
          .from('workouts')
          .insert({ user_id: userA.id, routine_id: null })

        expect(secondError).not.toBeNull()
        expect(secondError!.code).toBe('23505')
      } finally {
        // Finish it immediately (rather than waiting for the suite-level
        // afterAll) so this test never leaves an active workout behind that
        // would break a later run of this same suite.
        await userA.client.from('workouts').update({ finished_at: new Date().toISOString() }).eq('id', first!.id)
        cleanup.push({ table: 'workouts', client: userA.client, match: { id: first!.id } })
      }
    })
  })
})
