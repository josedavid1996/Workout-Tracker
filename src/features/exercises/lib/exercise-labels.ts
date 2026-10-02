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
  shoulders: 'Hombros',
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
// anatomy terms seen in `secondary_muscles`.
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
  'latissimus dorsi': 'Dorsal ancho',
  lats: 'Dorsales',
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
  shoulders: 'Hombros',
  soleus: 'Sóleo',
  spine: 'Columna',
  sternocleidomastoid: 'Esternocleidomastoideo',
  'tibialis anterior': 'Tibial anterior',
  trapezius: 'Trapecio',
  traps: 'Trapecios',
  triceps: 'Tríceps',
  'upper back': 'Espalda alta',
  'upper chest': 'Pecho superior',
  'wrist extensors': 'Extensores de muñeca',
  'wrist flexors': 'Flexores de muñeca',
  wrists: 'Muñecas',
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
