import { Link, useNavigate } from 'react-router-dom'
import { daysSince } from '../../../shared/lib/days-since'
import { lastUsedLabel } from '../../../shared/lib/last-used-label'
import { initials } from '../../../shared/lib/initials'
import { resolveDisplayName } from '../../../shared/lib/resolve-display-name'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { StatTile } from '../../../shared/ui/stat-tile'
import iconDecorRings from '../../../assets/icons/icon-decor-rings.svg'
import iconEmptyRings from '../../../assets/icons/icon-empty-rings.svg'
import iconPlay from '../../../assets/icons/icon-play.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconRoutineList from '../../../assets/icons/icon-routine-list.svg'
import { useSession } from '../../auth/api/use-session'
import { useHomeStatsQuery, useWorkoutHistoryQuery } from '../../history/api/use-history'
import type { WorkoutHistoryItem } from '../../history/api/history'
import { computeStreakDays } from '../../history/lib/streak'
import { useRoutinesWithExercisesQuery } from '../../routines/api/use-routines'
import { estimateWorkoutMinutes } from '../../routines/lib/routine-summary'
import { useActiveWorkoutQuery, useStartWorkoutMutation } from '../../workout-session/api/use-workout-session'
import type { FeaturedReason } from '../lib/featured-routine'
import { pickFeaturedRoutine, todayDayOfWeek } from '../lib/featured-routine'

const RECENT_ACTIVITY_LIMIT = 3

const FEATURED_LABELS: Record<FeaturedReason, string> = {
  today: 'Hoy toca',
  recent: 'Última rutina',
  newest: 'Tu rutina',
}

function formatHeaderDate(date: Date): string {
  const weekday = date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '').toUpperCase()
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()
  return `${weekday} · ${day} ${month}`
}

function formatVolume(volumeKg: number): string {
  if (volumeKg >= 1000) return `${(volumeKg / 1000).toFixed(1)}k`
  return String(volumeKg)
}

// `/` — dashboard. Real data only, reusing existing feature api/hooks (no
// new tables): `history` (finished-workout list + aggregated stats) and
// `routines` (the one-tap featured routine + exercise count). See per-tile
// heuristics inline below and in `features/history/lib/{streak,home-stats}.ts`.
export function HomePage() {
  const { session } = useSession()
  const navigate = useNavigate()
  const activeWorkoutQuery = useActiveWorkoutQuery()
  const startMutation = useStartWorkoutMutation()
  const historyQuery = useWorkoutHistoryQuery()
  const statsQuery = useHomeStatsQuery()
  const routinesQuery = useRoutinesWithExercisesQuery()

  // Prefers a real, user-set `display_name` (set via the Perfil page,
  // PR11) over the email-derived heuristic — see `resolve-display-name.ts`.
  const name = resolveDisplayName(session?.user.user_metadata?.display_name, session?.user.email)
  const history = historyQuery.data ?? []
  const routines = routinesQuery.data ?? []

  // The featured card starts its routine in one tap: today's routine by
  // `day_of_week`, else the last one used — see `featured-routine.ts`.
  const mostRecentWithRoutine = history.find((item) => item.routineId !== null)
  const featured = pickFeaturedRoutine({
    routines,
    lastUsedRoutineId: mostRecentWithRoutine?.routineId ?? null,
    dayOfWeek: todayDayOfWeek(new Date()),
  })
  const featuredRoutine = featured?.routine ?? null
  const featuredHistoryItem = featuredRoutine
    ? (history.find((item) => item.routineId === featuredRoutine.id) ?? null)
    : null
  // At most one workout can be active (`workouts_single_active_idx`), so
  // while one is open the card resumes it instead of starting another.
  const activeWorkout = activeWorkoutQuery.data ?? null

  async function handleStartFeatured() {
    if (activeWorkout) {
      navigate(`/workout/${activeWorkout.id}`)
      return
    }
    if (!featuredRoutine) return
    const workout = await startMutation.mutateAsync(featuredRoutine.id)
    navigate(`/workout/${workout.id}`)
  }

  // Real, computed streak — not a placeholder — see
  // `features/history/lib/streak.ts#computeStreakDays`.
  const streakDays = computeStreakDays(history.map((item) => item.finishedAt))
  const recentActivity = history.slice(0, RECENT_ACTIVITY_LIMIT)

  const isLoading = historyQuery.isLoading || routinesQuery.isLoading

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <header className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">{formatHeaderDate(new Date())}</span>
            <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
              Hola, {name}
            </h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface font-display text-sm font-bold text-foreground">
            {initials(name)}
          </div>
        </header>

        {isLoading && <p className="text-muted">Cargando...</p>}
        {historyQuery.isError && <p className="text-sm text-red-400">No se pudo cargar la actividad reciente.</p>}

        {!isLoading && !featuredRoutine && <EmptyHomeState />}

        {!isLoading && featured && featuredRoutine && (
          <FeaturedRoutineCard
            label={FEATURED_LABELS[featured.reason]}
            routineName={featuredRoutine.name}
            exerciseCount={featuredRoutine.routine_exercises.length}
            historyItem={featuredHistoryItem}
            hasActiveWorkout={activeWorkout !== null}
            isStarting={startMutation.isPending}
            onStart={handleStartFeatured}
          />
        )}
        {startMutation.isError && <p className="text-sm text-red-400">No se pudo iniciar el workout.</p>}

        <div className="flex gap-2">
          <StatTile label="Sesiones" value={String(statsQuery.data?.sessions ?? 0)} />
          <StatTile
            label="Volumen kg"
            value={formatVolume(statsQuery.data?.volumeKg ?? 0)}
            valueClassName="text-data"
          />
          <StatTile label="PRs" value={String(statsQuery.data?.prCount ?? 0)} valueClassName="text-positive" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-1 flex-col">
            <span className="font-display text-sm uppercase tracking-wide text-foreground">Racha activa</span>
            <span className="text-xs text-muted">Días seguidos entrenando</span>
          </div>
          <span className="font-mono text-lg text-foreground">
            {streakDays}
            <span className="text-muted">d</span>
          </span>
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground">Actividad reciente</h2>
            <Link to="/history" className="text-xs text-data hover:underline">
              Ver todo
            </Link>
          </div>

          {recentActivity.length === 0 && <p className="text-sm text-muted">Todavía no hay entrenamientos.</p>}

          <ul className="flex flex-col gap-2">
            {recentActivity.map((item) => (
              <RecentActivityRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      </div>

      <BottomNav />
    </div>
  )
}

function RecentActivityRow({ item }: { item: WorkoutHistoryItem }) {
  return (
    <li>
      <Link
        to={`/workout/${item.id}/summary`}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 hover:border-accent/60"
      >
        <img src={iconRoutineList} alt="" className="h-5 w-5 opacity-70" />
        <div className="flex flex-1 flex-col">
          <span className="text-sm text-foreground">{item.routineName ?? 'Freestyle'}</span>
          <span className="font-mono text-xs text-muted">
            {new Date(item.createdAt).toLocaleDateString()} · {item.duration}
          </span>
        </div>
        <span className="font-mono text-sm text-data">{item.volume}kg</span>
      </Link>
    </li>
  )
}

function FeaturedRoutineCard({
  label,
  routineName,
  exerciseCount,
  historyItem,
  hasActiveWorkout,
  isStarting,
  onStart,
}: {
  label: string
  routineName: string
  exerciseCount: number
  historyItem: Pick<WorkoutHistoryItem, 'duration' | 'createdAt'> | null
  hasActiveWorkout: boolean
  isStarting: boolean
  onStart: () => void
}) {
  // When the routine was actually run before, show its real recorded
  // duration; otherwise fall back to the documented per-exercise estimate
  // (`routine-summary.ts`) — never a fabricated number either way.
  const minutesLabel = historyItem ? historyItem.duration : `~${estimateWorkoutMinutes(exerciseCount)} min`
  const lastUsedText = lastUsedLabel(historyItem ? daysSince(historyItem.createdAt) : null)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-4">
      <img
        src={iconDecorRings}
        alt=""
        className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 opacity-20"
      />
      <div className="relative flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="font-display text-xl font-extrabold uppercase tracking-wide text-foreground">
          {routineName}
        </span>
        <span className="font-mono text-xs text-muted">
          {exerciseCount} ejercicios · {minutesLabel}
        </span>
        <span className="text-xs text-muted">{lastUsedText}</span>
        <Button
          type="button"
          className="mt-1 flex w-full items-center justify-center gap-2"
          disabled={isStarting}
          onClick={onStart}
        >
          <img src={iconPlay} alt="" className="h-4 w-4" />
          {hasActiveWorkout ? 'Continuar workout' : isStarting ? 'Iniciando...' : 'Iniciar workout'}
        </Button>
        {!hasActiveWorkout && (
          <Link to="/workout/start" className="text-center text-xs text-data hover:underline">
            Otra rutina o freestyle
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyHomeState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-center">
      <img src={iconEmptyRings} alt="" className="h-16 w-16 opacity-60" />
      <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">Sin rutinas aún</h2>
      <p className="text-sm text-muted">Creá tu primera rutina para empezar a entrenar.</p>
      <Link to="/routines/new">
        <Button className="flex items-center gap-2">
          <img src={iconPlus} alt="" className="h-4 w-4" />
          Crear primera rutina
        </Button>
      </Link>
    </div>
  )
}
