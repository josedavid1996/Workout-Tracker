// `set_entries` has no column that preserves insertion order (no
// `created_at`, and `id` is a random `gen_random_uuid()`, not sortable by
// time — see migration `0006_set_entries_created_at.sql`, not yet applied
// to the live instance). Without an explicit `.order()`, Postgres/PostgREST
// gives no guarantee that two fetches of the same rows come back in the
// same order — confirmed live: editing one set's tag (an UPDATE) can change
// the physical row order the very next fetch returns, which silently
// reshuffled which weight/reps showed under "Set 1"/"Set 2"/etc.
//
// This keeps the on-screen order stable for the lifetime of one page
// session by remembering the last-seen id order and re-applying it to every
// new fetch, until the real schema fix (the `created_at` migration) lands.
// A genuinely new id (just-added set) is appended at the end, in the order
// it arrived — exactly where a new set belongs.
export function reorderByRememberedIds<T extends { id: string }>(
  items: T[],
  rememberedOrder: string[] | undefined,
): T[] {
  if (!rememberedOrder || rememberedOrder.length === 0) return items

  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered: T[] = []

  for (const id of rememberedOrder) {
    const item = byId.get(id)
    if (item) {
      ordered.push(item)
      byId.delete(id)
    }
  }

  // Whatever's left in `byId` wasn't in the remembered order (new since the
  // last render) — append it in its incoming order.
  for (const item of items) {
    if (byId.has(item.id)) ordered.push(item)
  }

  return ordered
}
