export type PlateInventory = { weight: number; count: number }[]

export type PlatePlan = {
  perSide: { weight: number; qty: number }[]
  achievedWeight: number
}

// Tolerance for floating point comparisons when matching plate weights
// against the remaining target for a side.
const EPSILON = 1e-6

// Greedy plate calculator: distributes (targetWeight - barWeight) / 2 per
// side using the largest available plates first. Inventory counts are
// divided by 2 (Math.floor(count / 2)) because a pair (one per side) is
// placed at a time — an odd count leaves one plate unused. If the exact
// target cannot be reached, this returns the best achievable approximation
// (whatever the greedy pass fills), never throwing and never over-shooting.
export function planPlates(
  targetWeight: number,
  barWeight: number,
  inventory: PlateInventory | undefined,
): PlatePlan | null {
  if (!inventory || inventory.length === 0) return null

  if (targetWeight <= barWeight) {
    return { perSide: [], achievedWeight: barWeight }
  }

  const perSideTarget = (targetWeight - barWeight) / 2
  const sortedByWeightDesc = [...inventory].sort((a, b) => b.weight - a.weight)

  const perSide: { weight: number; qty: number }[] = []
  let remaining = perSideTarget

  for (const plate of sortedByWeightDesc) {
    if (plate.weight <= 0) continue

    const availablePerSide = Math.floor(plate.count / 2)
    if (availablePerSide <= 0) continue

    const maxByRemaining = Math.floor((remaining + EPSILON) / plate.weight)
    const qty = Math.min(availablePerSide, maxByRemaining)

    if (qty > 0) {
      perSide.push({ weight: plate.weight, qty })
      remaining -= qty * plate.weight
    }
  }

  const achievedPerSide = perSide.reduce((sum, plate) => sum + plate.weight * plate.qty, 0)
  const achievedWeight = barWeight + achievedPerSide * 2

  return { perSide, achievedWeight }
}

// Practical increment plates/bars are commonly loaded in.
const PRACTICAL_INCREMENT = 2.5

function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment
}

// Percentages of the (target - bar) range used for each ramp step. Fixed at
// [40%, 60%, 80%, 90%] for the default 4-step ramp; for any other step
// count, percentages are spread evenly between 40% and 90%.
function rampPercentages(steps: number): number[] {
  if (steps === 4) return [0.4, 0.6, 0.8, 0.9]
  if (steps <= 1) return [0.9]

  const start = 0.4
  const end = 0.9
  return Array.from({ length: steps }, (_, i) => start + ((end - start) * i) / (steps - 1))
}

// Warm-up ramp from barWeight up to targetWeight. Never depends on plate
// inventory, so the calculator always has a ramp to show even when the user
// has not configured any plates. If targetWeight <= barWeight there is no
// room to ramp, so every step is just the bar.
export function warmupRamp(targetWeight: number, barWeight: number, steps: number = 4): number[] {
  if (targetWeight <= barWeight) {
    return Array.from({ length: steps }, () => barWeight)
  }

  const range = targetWeight - barWeight

  return rampPercentages(steps).map((pct) => {
    const raw = barWeight + range * pct
    const rounded = roundToIncrement(raw, PRACTICAL_INCREMENT)
    return Math.min(Math.max(rounded, barWeight), targetWeight)
  })
}
