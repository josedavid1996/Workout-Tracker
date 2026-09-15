// The earlier option lists here were curated guesses (common values for
// *other* exercise catalogs, e.g. free-exercise-db's `category`), never
// checked against this dataset's real values — 8 of the 13 chips they
// produced (5/6 "Categoría", 3/7 "Parte del cuerpo") matched zero rows.
// Verified directly against the live instance's full 1324 rows: `category`
// and `body_part` store the identical 10-value vocabulary below (same
// value on every row — this dataset never actually distinguishes the two
// columns), so both filter sections share this one real list.
const REAL_MUSCLE_GROUP_VALUES = [
  'chest',
  'back',
  'shoulders',
  'upper arms',
  'lower arms',
  'upper legs',
  'lower legs',
  'waist',
  'cardio',
  'neck',
]

export const EXERCISE_CATEGORY_OPTIONS = REAL_MUSCLE_GROUP_VALUES
export const EXERCISE_BODY_PART_OPTIONS = REAL_MUSCLE_GROUP_VALUES

// `EXERCISE_EQUIPMENT_OPTIONS` (raw equipment value list) was superseded in
// PR7 by `features/exercises/lib/equipment-category.ts`'s 6 visual
// categories, which map to the REAL discovered `equipment` values (see that
// module's comment) instead of this earlier curated guess.
