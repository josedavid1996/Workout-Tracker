import { describe, expect, it } from 'vitest'
import type { PlateInventory } from './plates'
import { planPlates, warmupRamp } from './plates'

describe('planPlates', () => {
  it('exactly fills the target weight when inventory is sufficient', () => {
    const inventory: PlateInventory = [
      { weight: 20, count: 4 },
      { weight: 10, count: 4 },
      { weight: 5, count: 2 },
    ]
    const plan = planPlates(100, 20, inventory)
    expect(plan).toEqual({ perSide: [{ weight: 20, qty: 2 }], achievedWeight: 100 })
  })

  it('returns the best possible approximation when inventory cannot reach the exact target', () => {
    const inventory: PlateInventory = [
      { weight: 20, count: 4 },
      { weight: 10, count: 4 },
      { weight: 5, count: 2 },
    ]
    // Target needs 42.5kg/side; greedy from largest plate down leaves 2.5kg/side
    // unfilled because no smaller plate (10kg, 5kg) fits in the remainder.
    const plan = planPlates(105, 20, inventory)
    expect(plan).toEqual({ perSide: [{ weight: 20, qty: 2 }], achievedWeight: 100 })
  })

  it('returns null when there is no inventory configured', () => {
    expect(planPlates(100, 20, [])).toBeNull()
    expect(planPlates(100, 20, undefined)).toBeNull()
  })

  it('returns just the bar when the target is at or below bar weight', () => {
    const inventory: PlateInventory = [{ weight: 20, count: 4 }]
    expect(planPlates(20, 20, inventory)).toEqual({ perSide: [], achievedWeight: 20 })
    expect(planPlates(10, 20, inventory)).toEqual({ perSide: [], achievedWeight: 20 })
  })
})

describe('warmupRamp', () => {
  it('produces an increasing ramp from bar to target rounded to practical increments', () => {
    expect(warmupRamp(100, 20)).toEqual([52.5, 67.5, 85, 92.5])
  })

  it('supports a custom step count', () => {
    expect(warmupRamp(100, 20, 3)).toEqual([52.5, 72.5, 92.5])
  })

  it('works without any plate inventory configured (no dependency on it)', () => {
    expect(warmupRamp(100, 20)).toHaveLength(4)
  })

  it('falls back to the bar weight when the target is at or below bar weight', () => {
    expect(warmupRamp(20, 20)).toEqual([20, 20, 20, 20])
    expect(warmupRamp(10, 20)).toEqual([20, 20, 20, 20])
  })
})
