import { beforeEach, describe, expect, it, vi } from 'vitest'

// Same minimal chainable Supabase query-builder mock used by
// `features/workout-session/api/workout-session.test.ts`, extended with `upsert`.
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
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

import { planPlates } from '../../../shared/lib/plates'
import { getUserEquipment, saveUserEquipment } from './equipment'

beforeEach(() => {
  from.mockReset()
  getUser.mockReset()
})

describe('getUserEquipment', () => {
  it('returns bar_weight and plate_inventory when a row exists', async () => {
    const builder = makeQueryBuilder({
      data: { bar_weight: 20, plate_inventory: [{ weight: 20, count: 4 }] },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await getUserEquipment()

    expect(from).toHaveBeenCalledWith('user_equipment')
    expect(result).toEqual({ bar_weight: 20, plate_inventory: [{ weight: 20, count: 4 }] })
  })

  it('degrades gracefully to null when no row exists yet (equipment settings not configured)', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: null }))
    expect(await getUserEquipment()).toBeNull()
  })

  it('degrades gracefully to null instead of throwing on an unexpected query error', async () => {
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'boom' } }))
    expect(await getUserEquipment()).toBeNull()
  })
})

describe('saveUserEquipment', () => {
  it('upserts the current user row keyed by user_id (the table PK)', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const builder = makeQueryBuilder({
      data: { bar_weight: 25, plate_inventory: [{ weight: 20, count: 2 }] },
      error: null,
    })
    from.mockReturnValue(builder)

    const result = await saveUserEquipment(25, [{ weight: 20, count: 2 }])

    expect(from).toHaveBeenCalledWith('user_equipment')
    expect(builder.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', bar_weight: 25, plate_inventory: [{ weight: 20, count: 2 }] },
      { onConflict: 'user_id' },
    )
    expect(result).toEqual({ bar_weight: 25, plate_inventory: [{ weight: 20, count: 2 }] })
  })

  it('throws when there is no authenticated user', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(saveUserEquipment(20, [])).rejects.toThrow('Not authenticated')
    expect(from).not.toHaveBeenCalled()
  })

  it('propagates an upsert error', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    from.mockReturnValue(makeQueryBuilder({ data: null, error: { message: 'upsert failed' } }))

    await expect(saveUserEquipment(20, [])).rejects.toEqual({ message: 'upsert failed' })
  })
})

// Light integration test (mocked, no real instance needed): confirms
// `getUserEquipment()`'s shape feeds `planPlates()` (PR2, shared/lib/plates.ts)
// correctly once a real row exists — the plate-calculator component itself
// is not touched by this PR, only verified here that the wiring works.
describe('getUserEquipment -> planPlates integration', () => {
  it('produces a full plate breakdown once a real equipment row is saved', async () => {
    const builder = makeQueryBuilder({
      data: { bar_weight: 20, plate_inventory: [{ weight: 20, count: 4 }, { weight: 10, count: 4 }] },
      error: null,
    })
    from.mockReturnValue(builder)

    const equipment = await getUserEquipment()
    const plan = planPlates(100, equipment!.bar_weight, equipment!.plate_inventory)

    expect(plan).toEqual({
      perSide: [
        { weight: 20, qty: 2 },
        { weight: 10, qty: 0 },
      ].filter((p) => p.qty > 0),
      achievedWeight: 100,
    })
  })
})
