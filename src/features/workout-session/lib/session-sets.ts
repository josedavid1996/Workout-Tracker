// Display rules for the set rows of the active session.

type OrderableSet = { completed: boolean; completed_at: string | null }

// `set_entries` has no reliable insertion-order column on the live schema
// (see `reorder-by-remembered-ids.ts`), so a fresh fetch can return rows in
// any order. This derives a stable one from data that IS there: completed
// sets first, in the order they were completed, then the pending ones.
export function orderSets<T extends OrderableSet>(sets: T[]): T[] {
  const completed = sets
    .filter((set) => set.completed)
    .sort((a, b) => new Date(a.completed_at ?? 0).getTime() - new Date(b.completed_at ?? 0).getTime())
  const pending = sets.filter((set) => !set.completed)
  return [...completed, ...pending]
}

// `set_entries.weight` is NOT NULL, so an unknown weight is stored as 0.
// `'missing'` = the user cleared the field; `'confirmed'` = the user typed an
// explicit 0 (bodyweight). With no override, a pending set at 0 kg counts as
// "not filled in yet" — it shows empty and can't be completed.
export type WeightOverride = 'missing' | 'confirmed'

export function isWeightMissing(
  set: { weight: number; completed: boolean },
  override: WeightOverride | undefined,
): boolean {
  if (set.completed) return false
  if (override === 'missing') return true
  if (override === 'confirmed') return false
  return set.weight === 0
}
