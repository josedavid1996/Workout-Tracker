// Representative, curated option lists for the exercise-picker filter
// chips. The `exercises` catalog has no distinct-values endpoint in this
// PR, so these are common values for the dataset's `category`/`body_part`/
// `equipment` columns rather than a dynamically fetched enum. Revisit with a
// distinct-value query if the real catalog uses a materially different
// vocabulary.
export const EXERCISE_CATEGORY_OPTIONS = [
  'strength',
  'cardio',
  'stretching',
  'plyometrics',
  'powerlifting',
  'olympic weightlifting',
]
export const EXERCISE_BODY_PART_OPTIONS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']

// `EXERCISE_EQUIPMENT_OPTIONS` (raw equipment value list) was superseded in
// PR7 by `features/exercises/lib/equipment-category.ts`'s 6 visual
// categories, which map to the REAL discovered `equipment` values (see that
// module's comment) instead of this earlier curated guess.
