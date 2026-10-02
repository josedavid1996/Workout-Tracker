// DISPLAY-ONLY Spanish labels for the `exercises` catalog's English metadata
// (`category`/`body_part`, `equipment`, `target`/`muscle_group`/
// `secondary_muscles`). The database stays in English: every filter, query
// and comparison must keep using the raw values — call these only at the
// point a value is rendered. Unknown values (the catalog is externally
// populated) fall back to the raw value instead of throwing.

const BODY_PART_LABELS: Record<string, string> = {
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  back: 'Espalda',
  chest: 'Pecho',
  shoulders: 'Deltoides',
  'upper legs': 'Piernas',
  'lower legs': 'Pantorrillas',
  cardio: 'Cardio',
  neck: 'Cuello',
  waist: 'Abdomen',
}

const EQUIPMENT_LABELS: Record<string, string> = {
  dumbbell: 'Mancuerna',
  'body weight': 'Peso corporal',
  cable: 'Polea',
  barbell: 'Barra',
  'leverage machine': 'Máquina',
  band: 'Banda elástica',
  kettlebell: 'Pesa rusa',
  'ez barbell': 'Barra EZ',
  'stability ball': 'Balón de estabilidad',
  assisted: 'Asistido',
  rope: 'Cuerda',
  'sled machine': 'Máquina de trineo',
  'upper body ergometer': 'Ergómetro de brazos',
  'medicine ball': 'Balón medicinal',
}

// Superset: every live `target` and `muscle_group` value plus common
// anatomy terms seen in `secondary_muscles`. Synonyms MUST share one label
// (traps/trapezius, delts/deltoids/shoulders, lats/latissimus dorsi,
// abs/abdominals, quads/quadriceps) so lists deduped by label never show the
// same muscle twice. `shoulders` here is the muscle (body-part `shoulders`
// goes through `bodyPartLabel` → "Hombros").
const MUSCLE_LABELS: Record<string, string> = {
  abs: 'Abdominales',
  abdominals: 'Abdominales',
  abductors: 'Abductores',
  adductors: 'Aductores',
  ankles: 'Tobillos',
  'ankle stabilizers': 'Estabilizadores del tobillo',
  back: 'Espalda',
  biceps: 'Bíceps',
  brachialis: 'Braquial',
  brachioradialis: 'Braquiorradial',
  calves: 'Pantorrillas',
  'cardiovascular system': 'Sistema cardiovascular',
  chest: 'Pecho',
  core: 'Core',
  delts: 'Deltoides',
  deltoids: 'Deltoides',
  'front deltoids': 'Deltoides anteriores',
  'rear deltoids': 'Deltoides posteriores',
  feet: 'Pies',
  forearms: 'Antebrazos',
  glutes: 'Glúteos',
  groin: 'Ingle',
  hamstrings: 'Isquiotibiales',
  hands: 'Manos',
  'hip flexors': 'Flexores de cadera',
  hips: 'Caderas',
  'inner thighs': 'Aductores (cara interna del muslo)',
  'outer thighs': 'Cara externa del muslo',
  'latissimus dorsi': 'Dorsal',
  lats: 'Dorsal',
  'levator scapulae': 'Elevador de la escápula',
  'lower abs': 'Abdominales inferiores',
  'lower back': 'Zona lumbar',
  neck: 'Cuello',
  obliques: 'Oblicuos',
  pectorals: 'Pectorales',
  quadriceps: 'Cuádriceps',
  quads: 'Cuádriceps',
  rhomboids: 'Romboides',
  'rotator cuff': 'Manguito rotador',
  'serratus anterior': 'Serrato anterior',
  shins: 'Espinillas',
  shoulders: 'Deltoides',
  soleus: 'Sóleo',
  spine: 'Columna',
  sternocleidomastoid: 'Esternocleidomastoideo',
  'tibialis anterior': 'Tibial anterior',
  trapezius: 'Trapecio',
  traps: 'Trapecio',
  triceps: 'Tríceps',
  'upper back': 'Espalda alta',
  'upper chest': 'Pecho superior',
  'wrist extensors': 'Extensores de muñeca',
  'wrist flexors': 'Flexores de muñeca',
  wrists: 'Muñecas',
}

// Every key allowed by `exercise_focus.focus` (see
// `supabase/migrations/0011_exercise_focus.sql`): the specific muscle region
// an exercise emphasizes most.
const FOCUS_LABELS: Record<string, string> = {
  adductors: 'Aductores',
  anterior_deltoid: 'Deltoide anterior',
  biceps_long_head: 'Bíceps · cabeza larga',
  biceps_short_head: 'Bíceps · cabeza corta',
  brachialis: 'Braquial',
  deep_core: 'Core profundo',
  forearm_extensors: 'Extensores del antebrazo',
  forearm_flexors: 'Flexores del antebrazo',
  gastrocnemius: 'Gastrocnemio',
  gluteus_maximus: 'Glúteo mayor',
  gluteus_medius: 'Glúteo medio',
  hamstrings: 'Isquiotibiales',
  lateral_deltoid: 'Deltoide lateral',
  lats: 'Dorsal',
  lower_abs: 'Abdominales inferiores',
  lower_back: 'Zona lumbar',
  lower_chest: 'Pectoral inferior',
  mid_back: 'Espalda media',
  mid_chest: 'Pectoral medio',
  neck: 'Cuello',
  obliques: 'Oblicuos',
  posterior_deltoid: 'Deltoide posterior',
  quads_rectus_femoris: 'Cuádriceps · recto femoral',
  quads_vastus: 'Cuádriceps · vastos',
  rotator_cuff: 'Manguito rotador',
  soleus: 'Sóleo',
  triceps_lateral_head: 'Tríceps · cabeza lateral',
  triceps_long_head: 'Tríceps · cabeza larga',
  triceps_medial_head: 'Tríceps · cabeza medial',
  upper_abs: 'Abdominales superiores',
  upper_chest: 'Pectoral superior',
  upper_traps: 'Trapecio superior',
}

function lookup(labels: Record<string, string>, value: string | null | undefined): string {
  if (!value) return ''
  return labels[value.trim().toLowerCase()] ?? value
}

export function bodyPartLabel(value: string | null | undefined): string {
  return lookup(BODY_PART_LABELS, value)
}

export function equipmentLabel(value: string | null | undefined): string {
  return lookup(EQUIPMENT_LABELS, value)
}

export function muscleLabel(value: string | null | undefined): string {
  return lookup(MUSCLE_LABELS, value)
}

export function focusLabel(value: string | null | undefined): string {
  return lookup(FOCUS_LABELS, value)
}

// Translates muscle values and dedupes by the DISPLAYED label (so synonyms
// collapse into one pill), keeping first-seen order and skipping blanks.
export function uniqueMuscleLabels(values: ReadonlyArray<string | null | undefined>): string[] {
  const labels = new Set<string>()
  for (const value of values) {
    const label = muscleLabel(value)
    if (label) labels.add(label)
  }
  return Array.from(labels)
}

// The single "main muscle" label shown for an exercise: its `exercise_focus`
// when known, else its catalog `target`. Never `muscle_group` — that column
// is unreliable (e.g. lateral raise → traps).
export function primaryMuscleLabel(focus: string | null | undefined, target: string | null | undefined): string {
  return focus ? focusLabel(focus) : muscleLabel(target)
}
