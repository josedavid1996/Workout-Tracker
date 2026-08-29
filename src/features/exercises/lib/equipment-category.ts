// Maps the real, discovered distinct values of `exercises.equipment` (found
// by querying the live Supabase instance's `exercises` table — see PR7
// apply-progress notes) to the 6 visual equipment categories from the
// Figma design (`04-selector-ejercicio.md`). This is NOT a 1:1 mapping: the
// raw catalog uses specific gym-equipment terms, the design groups them
// into 6 broad icon categories.
//
// Discovered raw values (2026-08-29, live query, counts omitted):
// dumbbell, body weight, cable, barbell, leverage machine, band,
// kettlebell, ez barbell, stability ball, assisted, rope,
// upper body ergometer, sled machine, medicine ball.
//
// Notes on debatable calls:
// - `assisted` (assisted pull-up/dip machine) → `machine`, not
//   `bodyweight`: it is a machine-assisted movement, not a pure
//   bodyweight exercise.
// - `upper body ergometer` (arm bike) → `cardio`: the only raw value in
//   this catalog that maps to cardio equipment. No literal "cardio" raw
//   value exists (unlike `body_part`, which does have its own `cardio`
//   value) — this dataset is mostly strength equipment.
export type EquipmentCategory = 'freeweight' | 'machine' | 'cable' | 'bodyweight' | 'cardio' | 'accessory'

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'freeweight',
  'machine',
  'cable',
  'bodyweight',
  'cardio',
  'accessory',
]

const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  freeweight: 'Peso libre',
  machine: 'Máquina',
  cable: 'Cable',
  bodyweight: 'Peso corporal',
  cardio: 'Cardio',
  accessory: 'Accesorio',
}

const RAW_EQUIPMENT_TO_CATEGORY: Record<string, EquipmentCategory> = {
  dumbbell: 'freeweight',
  barbell: 'freeweight',
  'ez barbell': 'freeweight',
  kettlebell: 'freeweight',
  'body weight': 'bodyweight',
  assisted: 'machine',
  cable: 'cable',
  'leverage machine': 'machine',
  'sled machine': 'machine',
  band: 'accessory',
  'stability ball': 'accessory',
  rope: 'accessory',
  'medicine ball': 'accessory',
  'upper body ergometer': 'cardio',
}

// Unknown/future raw values default to `accessory` (the safest "misc"
// bucket) instead of throwing — `exercises` is a shared, externally
// populated catalog this app never writes to, so new equipment values can
// appear without a code change here.
export function equipmentToCategory(rawEquipment: string | null | undefined): EquipmentCategory {
  if (!rawEquipment) return 'accessory'
  return RAW_EQUIPMENT_TO_CATEGORY[rawEquipment.toLowerCase()] ?? 'accessory'
}

export function equipmentCategoryLabel(category: EquipmentCategory): string {
  return EQUIPMENT_CATEGORY_LABELS[category]
}

// Reverse lookup: every raw equipment value that belongs to a given visual
// category — used by the exercise picker to translate a selected "EQUIPO"
// chip (a category) into the set of raw `equipment` values to filter by.
export function rawEquipmentValuesForCategory(category: EquipmentCategory): string[] {
  return Object.entries(RAW_EQUIPMENT_TO_CATEGORY)
    .filter(([, mappedCategory]) => mappedCategory === category)
    .map(([raw]) => raw)
}
