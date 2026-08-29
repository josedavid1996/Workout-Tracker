// `exercises.instruction_steps` is a per-language object (`{ en, es, fr, ... }`,
// confirmed live against the real Supabase instance — see PR10 plan notes)
// whose values are arrays of numbered steps (unlike `instructions`, whose
// values are a single paragraph). The Quick Reference sheet only ever shows
// Spanish, and must never silently fall back to another language when `es`
// is missing — the caller decides what to render instead (an empty array
// here becomes "Instrucciones no disponibles en español" in the UI).
export function getSpanishInstructionSteps(exercise: { instruction_steps: unknown }): string[] {
  const steps = exercise.instruction_steps

  if (steps === null || typeof steps !== 'object' || Array.isArray(steps)) return []

  const es = (steps as Record<string, unknown>).es
  if (!Array.isArray(es)) return []
  if (!es.every((step) => typeof step === 'string')) return []

  return es
}
