# equipment

Phase 10 (PR5). `/settings/equipment` — lets the user configure their bar
weight and available plate inventory (`user_equipment`, PK'd by `user_id`).

- `api/equipment.ts` — `getUserEquipment()` (canonical; re-exported from
  `features/workout-session/api/workout-session.ts` for that module's
  existing callers) and `saveUserEquipment(barWeight, plateInventory)`
  (upsert on `user_id`). Unit tested against a mocked query-builder
  (`equipment.test.ts`), including a light mocked integration test that
  feeds `getUserEquipment()`'s result into `shared/lib/plates.ts#planPlates`
  (PR2) to confirm the wiring — no real Supabase instance needed.
- `api/use-equipment.ts` — thin React Query wiring (not unit-tested
  separately, same convention as other `use-*.ts` files). Its query key is
  the same literal `['user-equipment']` array `use-workout-session.ts`
  already uses, so saving here also invalidates the plate calculator's
  cached equipment without either module importing the other's hook.
- `pages/equipment-settings-page.tsx` — bar weight input + an editable
  plate list (weight/count rows, add/remove). `shared/lib/plates.ts`'s
  `planPlates` (PR2) is not touched by this PR — it already handles "no
  inventory" vs. "real inventory"; saving here just makes a real row exist.
