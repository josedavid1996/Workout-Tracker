import { useQueries } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import iconCheckLarge from '../../../assets/icons/icon-check-large.svg'
import iconDecorRings from '../../../assets/icons/icon-decor-rings.svg'
import iconPrTrophy from '../../../assets/icons/icon-pr-trophy.svg'
import iconShare from '../../../assets/icons/icon-share.svg'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { isCountable } from '../../../shared/lib/countable-set'
import { sessionVolume } from '../../../shared/lib/volume'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { IconButton } from '../../../shared/ui/icon-button'
import { Skeleton } from '../../../shared/ui/skeleton'
import { fetchExerciseSetHistory } from '../../exercises/api/exercise-history'
import { exerciseHistoryQueryKeys } from '../../exercises/api/use-exercise-history'
import { useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { detectNewPrs } from '../lib/new-prs'
import { formatDuration } from '../lib/format-duration'
import { toCountableSet } from '../lib/to-countable-set'
import { useWorkoutQuery } from '../api/use-workout-session'

function formatHeaderDate(iso: string): string {
  const date = new Date(iso)
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase()
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()
  return `${weekday} · ${day} ${month}`
}

// `/workout/:id/summary` — real layout per
// `design/figma-reference/07-resumen-post-workout.md`. All numbers are
// static, one-shot (never a live counter): duration is `finished_at -
// created_at`, volume only sums countable sets (completed && tag !==
// 'warmup'), and "sets" counts every completed set regardless of tag.
//
// Also doubles as the read-only workout detail for `/history` (Phase 9,
// PR5) — once `finished_at` is set, this page already has no edit
// affordances, so finished-workout history items link straight here instead
// of a separate `/history/:workoutId` route.
//
// **Decision on "Duración"**: the real Figma grid is 2x2
// (Ejercicios/Volumen/Sets/PRs) with NO explicit duration tile — see the
// design doc's own open question. Rather than dropping the already-built,
// already-tested `formatDuration` value or forcing it into a 5th grid cell
// the design doesn't have, it is shown as a small subtitle next to the date
// in the header (`LUN 6 JUL · 42 min`), matching the doc's own suggestion
// that "the date in the header might be enough" — extended with the
// duration since that data already exists and dropping it silently would be
// a regression for existing users of this page.
export function WorkoutSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const workoutId = id as string
  const navigate = useNavigate()
  const workoutQuery = useWorkoutQuery(workoutId)
  const workout = workoutQuery.data

  const exerciseIds = workout ? workout.workout_exercises.map((exercise) => exercise.exercise_id) : []
  const exercisesQuery = useExercisesByIdsQuery(exerciseIds)
  const exerciseNameById = new Map((exercisesQuery.data ?? []).map((exercise) => [exercise.id, exercise.name]))

  // One history fetch per exercise in this workout, reusing the existing,
  // already-tested `fetchExerciseSetHistory` (exercise-detail feature) — no
  // new Supabase query shape, just fanned out per exercise via
  // `useQueries` so the "Nuevo PR" banner can compare this session's best
  // set against every OTHER session's best for the same exercise.
  const historyQueries = useQueries({
    queries: exerciseIds.map((exerciseId) => ({
      queryKey: exerciseHistoryQueryKeys.detail(exerciseId),
      queryFn: () => fetchExerciseSetHistory(exerciseId),
    })),
  })

  if (workoutQuery.isLoading || !workout) {
    return (
      <div className="min-h-dvh bg-background px-4 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-surface-2 to-background p-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
            Calculando métricas...
          </p>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const allSets = workout.workout_exercises.flatMap((exercise) => exercise.set_entries)
  const completedSets = allSets.filter((set) => set.completed)
  const countableSets = allSets.filter(isCountable).map(toCountableSet)
  const totalVolume = sessionVolume(countableSets)
  const duration = workout.finished_at ? formatDuration(workout.created_at, workout.finished_at) : '—'

  const currentSetsByExercise = new Map<string, CountableSet[]>()
  for (const set of countableSets) {
    const list = currentSetsByExercise.get(set.exerciseId) ?? []
    list.push(set)
    currentSetsByExercise.set(set.exerciseId, list)
  }

  const historicalSetsByExercise = new Map<string, CountableSet[]>()
  exerciseIds.forEach((exerciseId, index) => {
    const rows = historyQueries[index]?.data ?? []
    const historical = rows
      .filter((row) => row.workout_id !== workoutId)
      .filter(isCountable)
      .map(toCountableSet)
    historicalSetsByExercise.set(exerciseId, historical)
  })

  const newPrs = detectNewPrs(currentSetsByExercise, historicalSetsByExercise)

  async function handleShare() {
    // Best-effort only — sharing has no dedicated UI feedback, out of scope
    // per `design/figma-reference/07-resumen-post-workout.md`'s own note
    // that this button "puede quedar como placeholder sin funcionalidad
    // real si compartir no está en alcance".
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Workout completado', text: `Volumen: ${totalVolume}kg` })
      } catch {
        // User cancelled or share unsupported — nothing to do.
      }
    }
  }

  return (
    <div className="min-h-dvh bg-background pb-28">
      <div className="relative overflow-hidden bg-gradient-to-br from-surface-2 to-background px-4 pt-8 pb-6">
        <img src={iconDecorRings} alt="" className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 opacity-20" />
        <div className="relative mx-auto flex max-w-md flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-positive/20">
            <img src={iconCheckLarge} alt="" className="h-7 w-7" />
          </span>
          <span className="font-mono text-xs uppercase tracking-wide text-positive">Workout completado</span>
          <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">
            {workout.routine_id ? 'Rutina' : 'Freestyle'}
          </h1>
          <span className="font-mono text-xs text-muted">
            {formatHeaderDate(workout.created_at)} · {duration}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="Ejercicios" value={String(workout.workout_exercises.length)} />
          <SummaryTile label="Volumen kg" value={String(totalVolume)} valueClassName="text-data" />
          <SummaryTile label="Sets" value={String(completedSets.length)} />
          <SummaryTile
            label="PRs nuevos"
            value={String(newPrs.length)}
            valueClassName={newPrs.length > 0 ? 'text-positive' : undefined}
          />
        </div>

        {newPrs.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
            <img src={iconPrTrophy} alt="" className="h-6 w-6" />
            <div className="flex flex-col">
              <span className="font-mono text-xs font-bold uppercase tracking-wide text-data">Nuevo PR</span>
              <span className="text-sm text-foreground">
                {exerciseNameById.get(newPrs[0].exerciseId) ?? newPrs[0].exerciseId} · {newPrs[0].set.weight}kg x{' '}
                {newPrs[0].set.reps}
                {newPrs.length > 1 ? ` (+${newPrs.length - 1} más)` : ''}
              </span>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wide text-muted">Por ejercicio</h2>
          <ul className="flex flex-col gap-2">
            {workout.workout_exercises.map((exercise) => {
              const sets = exercise.set_entries.filter(isCountable)
              const topSet = sets.reduce<(typeof sets)[number] | null>((best, set) => {
                if (!best) return set
                return set.weight > best.weight ? set : best
              }, null)
              const exerciseVolume = sessionVolume(sets.map(toCountableSet))

              return (
                <li key={exercise.id}>
                  <Link
                    to={`/exercises/${exercise.exercise_id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:border-accent/60"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {exerciseNameById.get(exercise.exercise_id) ?? exercise.exercise_id}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {sets.length} sets{topSet ? ` · top ${topSet.weight}kg x ${topSet.reps}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-foreground">{exerciseVolume}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="flex gap-2 pt-2">
          <IconButton size="md" aria-label="Compartir" onClick={handleShare}>
            <img src={iconShare} alt="" className="h-4 w-4" />
          </IconButton>
          <Button type="button" className="flex-1" onClick={() => navigate('/')}>
            Guardar workout
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-3 py-4">
      <span className={valueClassName ? `font-mono text-2xl font-bold ${valueClassName}` : 'font-mono text-2xl font-bold text-foreground'}>
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  )
}
