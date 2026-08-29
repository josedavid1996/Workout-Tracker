import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import iconCalendar from '../../../assets/icons/icon-calendar.svg'
import { cx } from '../../../shared/lib/cx'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Chip } from '../../../shared/ui/chip'
import { IconButton } from '../../../shared/ui/icon-button'
import { Skeleton } from '../../../shared/ui/skeleton'
import { useRoutinesQuery } from '../../routines/api/use-routines'
import { useActiveWorkoutQuery } from '../../workout-session/api/use-workout-session'
import { useWorkoutHistoryQuery } from '../api/use-history'
import type { WorkoutHistoryItem } from '../api/history'
import type { HeatmapDay } from '../lib/heatmap'
import { computeMonthHeatmap } from '../lib/heatmap'

// `null` = "Todas" (no filter), `'freestyle'` = only workouts with no
// routine, otherwise an actual routine id.
type RoutineFilter = 'all' | 'freestyle' | string

const WEEKDAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function startOfWeek(date: Date): Date {
  const day = date.getDay() // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday)
  return monday
}

function isSameOrAfter(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime()
}

// `/history` — real layout per `design/figma-reference/08-historial-general.md`:
// a GitHub-style monthly activity heatmap (`shared`d via the pure, unit-tested
// `computeMonthHeatmap`, since the schema has no per-day load rollup to
// weight cells by — session COUNT per day is the simplest available and
// honest signal) plus a 3-column "esta semana" session list. The
// pre-existing routine filter (not shown in these 2 Figma variants) is kept,
// just moved below the main content per the doc's own note that it "can
// live behind the calendar button or as an additional filter not shown in
// these variants — don't remove the functionality, just relocate it".
export function HistoryPage() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState<RoutineFilter>(searchParams.get('routineId') ?? 'all')
  const [monthOffset, setMonthOffset] = useState(0)

  const activeWorkoutQuery = useActiveWorkoutQuery()
  const routinesQuery = useRoutinesQuery()
  const historyQuery = useWorkoutHistoryQuery()

  const items = useMemo(() => historyQuery.data ?? [], [historyQuery.data])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'freestyle') return items.filter((item) => item.routineId === null)
    return items.filter((item) => item.routineId === filter)
  }, [items, filter])

  const now = new Date()
  const displayedMonthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = displayedMonthDate.getFullYear()
  const month = displayedMonthDate.getMonth() + 1

  // Cheap pure computation over an already-small list — not worth memoizing
  // (and doing so tripped the React Compiler's manual-memoization check).
  const workoutDates = items.map((item) => item.createdAt)
  const heatmapCells: HeatmapDay[] = computeMonthHeatmap(workoutDates, year, month)
  const sessionsThisMonth = heatmapCells.reduce((sum, cell) => sum + cell.sessionsCount, 0)

  const weekStart = startOfWeek(now)
  const thisWeekItems = items.filter((item) => isSameOrAfter(new Date(item.createdAt), weekStart))

  const isLoading = historyQuery.isLoading

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">Historial</h1>
          <IconButton aria-label="Mes anterior" onClick={() => setMonthOffset((offset) => offset - 1)}>
            <img src={iconCalendar} alt="" className="h-4 w-4" />
          </IconButton>
        </div>

        {activeWorkoutQuery.data && (
          <Link
            to={`/workout/${activeWorkoutQuery.data.id}`}
            className="rounded-md border border-accent/60 bg-surface-2 px-4 py-3 text-accent hover:border-accent"
          >
            Entrenamiento en curso — continuar
          </Link>
        )}

        {isLoading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </>
        ) : (
          <>
            <MonthHeatmapCard
              monthLabel={MONTH_NAMES[month - 1]}
              year={year}
              sessionsCount={sessionsThisMonth}
              cells={heatmapCells}
              onNextMonth={monthOffset < 0 ? () => setMonthOffset((offset) => offset + 1) : undefined}
            />

            <span className="font-mono text-xs uppercase tracking-wider text-muted">Esta semana</span>

            {thisWeekItems.length === 0 && (
              <p className="text-sm text-muted">Todavía no hay entrenamientos esta semana.</p>
            )}

            <ul className="flex flex-col gap-2">
              {thisWeekItems.map((item) => (
                <WeekSessionRow key={item.id} item={item} />
              ))}
            </ul>

            <div className="flex flex-col gap-2 pt-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Filtrar por rutina</span>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
                  Todas
                </Chip>
                <Chip active={filter === 'freestyle'} onClick={() => setFilter('freestyle')}>
                  Freestyle
                </Chip>
                {routinesQuery.data?.map((routine) => (
                  <Chip key={routine.id} active={filter === routine.id} onClick={() => setFilter(routine.id)}>
                    {routine.name}
                  </Chip>
                ))}
              </div>

              {historyQuery.isError && <p className="text-red-400">No se pudo cargar el historial.</p>}
              {filteredItems.length === 0 && filter !== 'all' && (
                <p className="text-sm text-muted">Sin entrenamientos para este filtro.</p>
              )}

              <ul className="flex flex-col gap-2">
                {filter !== 'all' &&
                  filteredItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/workout/${item.id}/summary`}
                        className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3 hover:border-accent/60"
                      >
                        <span className="text-foreground">{item.routineName ?? 'Freestyle'}</span>
                        <span className="font-mono text-xs text-muted">{item.volume}kg</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function MonthHeatmapCard({
  monthLabel,
  year,
  sessionsCount,
  cells,
  onNextMonth,
}: {
  monthLabel: string
  year: number
  sessionsCount: number
  cells: HeatmapDay[]
  onNextMonth: (() => void) | undefined
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNextMonth}
          disabled={!onNextMonth}
          className="font-display text-sm font-bold uppercase tracking-wide text-foreground disabled:opacity-100"
        >
          {monthLabel} {year}
        </button>
        <span className="font-mono text-xs text-data">{sessionsCount} sesiones</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => (
          <span
            key={cell.dateIso}
            title={`${cell.day}: ${cell.sessionsCount} sesión(es)`}
            className={cx(
              'aspect-square rounded-sm',
              cell.isFuture && 'bg-[#111a2c]',
              !cell.isFuture && cell.level === 0 && 'bg-surface-2',
              !cell.isFuture && cell.level === 1 && 'bg-accent/50',
              !cell.isFuture && cell.level === 2 && 'bg-accent/70',
              !cell.isFuture && cell.level === 3 && 'bg-accent/90',
              cell.isToday && 'ring-1 ring-data',
            )}
          />
        ))}
      </div>
    </div>
  )
}

function WeekSessionRow({ item }: { item: WorkoutHistoryItem }) {
  const date = new Date(item.createdAt)
  const dayNumber = date.getDate()
  const weekday = WEEKDAY_LABELS[date.getDay()]

  return (
    <li>
      <Link
        to={`/workout/${item.id}/summary`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-accent/60"
      >
        <div className="flex w-9 shrink-0 flex-col items-center">
          <span className="font-mono text-base font-bold text-foreground">{dayNumber}</span>
          <span className="font-mono text-[9px] text-muted">{weekday}</span>
        </div>
        <span className="h-8 w-px bg-border" />
        <div className="flex flex-1 flex-col">
          <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
            {item.routineName ?? 'Freestyle'}
          </span>
          <span className="font-mono text-xs text-muted">{item.setsCount} sets</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-mono text-sm text-data">{item.volume}</span>
          <span className="font-mono text-[10px] text-muted">KG</span>
        </div>
      </Link>
    </li>
  )
}
