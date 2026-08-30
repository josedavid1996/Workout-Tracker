import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { DotItemDotProps } from 'recharts'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import iconBack from '../../../assets/icons/icon-back.svg'
import iconEmptyChart from '../../../assets/icons/icon-empty-chart.svg'
import iconPlay from '../../../assets/icons/icon-play.svg'
import iconRetry from '../../../assets/icons/icon-retry-detail.svg'
import iconWarningCircle from '../../../assets/icons/icon-warning-circle.svg'
import type { CountableSet } from '../../../shared/lib/countable-set'
import { isCountable } from '../../../shared/lib/countable-set'
import { estimateOneRm } from '../../../shared/lib/one-rm'
import { bestOverall } from '../../../shared/lib/records'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { Chip } from '../../../shared/ui/chip'
import { Skeleton } from '../../../shared/ui/skeleton'
import { toCountableSet } from '../../workout-session/lib/to-countable-set'
import { ExerciseThumbnail } from '../components/exercise-thumbnail'
import { useExerciseSetHistoryQuery } from '../api/use-exercise-history'
import { useExerciseQuery } from '../api/use-exercises'
import { computeEightWeekDelta } from '../lib/eight-week-delta'
import { toChartPoints } from '../lib/to-chart-points'

type ChartMetric = 'weight' | 'volume' | 'reps'

const CHART_METRIC_TABS: { id: ChartMetric; label: string; dataKey: 'oneRm' | 'volume' | 'reps' }[] = [
  { id: 'weight', label: 'Peso', dataKey: 'oneRm' },
  { id: 'volume', label: 'Volumen', dataKey: 'volume' },
  { id: 'reps', label: 'Reps', dataKey: 'reps' },
]

function formatDate(iso: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')
}

function ChartDot(props: DotItemDotProps) {
  const lowConfidence = Boolean((props.payload as { lowConfidence?: boolean } | undefined)?.lowConfidence)

  return (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={lowConfidence ? 5 : 3}
      fill={lowConfidence ? '#b4c5ff' : '#2563eb'}
      stroke={lowConfidence ? '#b4c5ff' : 'none'}
    />
  )
}

// `/exercises/:id` — real layout per
// `design/figma-reference/09-detalle-ejercicio.md`: ONE scrollable view
// (stats -> chart -> registro), NOT the 3 separate History/Chart/Records
// tabs built in PR5. This is a confirmed, deliberate layout change (see
// tasks.md) — `shared/ui/tabs.tsx` itself is untouched and still used
// elsewhere (login/signup toggle), only this page stops using it.
export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exerciseQuery = useExerciseQuery(id)
  const historyQuery = useExerciseSetHistoryQuery(id)

  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight')
  // Static photo by default, real animated demonstration on demand — only
  // offered when the catalog row actually has a `gif_url` (PR12: this
  // exercise's real media was never shown here at all before this fix).
  const [showGif, setShowGif] = useState(false)

  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data])
  const countableSets: CountableSet[] = useMemo(() => history.filter(isCountable).map(toCountableSet), [history])
  const chartPoints = useMemo(() => toChartPoints(countableSets), [countableSets])
  const best = useMemo(() => bestOverall(countableSets), [countableSets])
  const eightWeekDelta = useMemo(() => computeEightWeekDelta(countableSets), [countableSets])

  // Groups the raw (unfiltered) set history by the workout it was logged in,
  // for the "REGISTRO" list — each row is one session's summary for this
  // exercise (date + set count + top set), not one row per individual set.
  const registroRows = useMemo(() => {
    const byWorkout = new Map<string, typeof history>()
    for (const entry of history) {
      const list = byWorkout.get(entry.workout_id) ?? []
      list.push(entry)
      byWorkout.set(entry.workout_id, list)
    }

    return Array.from(byWorkout.values())
      .map((entries) => {
        const countable = entries.filter(isCountable)
        const topSet = countable.reduce<(typeof countable)[number] | null>((top, entry) => {
          if (!top) return entry
          return entry.weight > top.weight ? entry : top
        }, null)
        const isPr = Boolean(best && topSet && topSet.id === best.id)

        return {
          workoutId: entries[0].workout_id,
          date: entries[0].workout_created_at,
          setsCount: entries.length,
          topSet,
          isPr,
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [history, best])

  const isLoading = exerciseQuery.isLoading || historyQuery.isLoading

  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="flex flex-col items-center gap-1 border-b border-border px-4 py-4">
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            aria-label="Volver"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
          >
            <img src={iconBack} alt="" className="h-4 w-4" />
          </button>
          <span className="flex-1" />
        </div>
        <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
          {exerciseQuery.data?.name ?? 'Ejercicio'}
        </h1>
        {exerciseQuery.data && (
          <span className="font-mono text-xs text-muted">
            {[exerciseQuery.data.muscle_group, exerciseQuery.data.equipment].filter(Boolean).join(' · ')}
          </span>
        )}

        {exerciseQuery.data && (exerciseQuery.data.image || exerciseQuery.data.gif_url) && (
          <div className="flex w-full flex-col items-center gap-2 pt-2">
            <ExerciseThumbnail
              src={showGif && exerciseQuery.data.gif_url ? exerciseQuery.data.gif_url : exerciseQuery.data.image}
              alt={exerciseQuery.data.name}
              className="h-40 w-full max-w-xs rounded-xl border border-border bg-surface-2"
            />
            {exerciseQuery.data.image && exerciseQuery.data.gif_url && (
              <div className="flex gap-1.5">
                <Chip active={!showGif} onClick={() => setShowGif(false)}>
                  Foto
                </Chip>
                <Chip active={showGif} onClick={() => setShowGif(true)}>
                  Gif
                </Chip>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-4">
        {isLoading && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        )}

        {!isLoading && historyQuery.isError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-center">
            <img src={iconWarningCircle} alt="" className="h-14 w-14 opacity-70" />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
              No se pudo cargar
            </h2>
            <p className="text-sm text-muted">
              Revisa tu conexión. Tus datos siguen guardados localmente.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => historyQuery.refetch()}
              className="flex items-center gap-2"
            >
              <img src={iconRetry} alt="" className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !historyQuery.isError && history.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-center">
            <img src={iconEmptyChart} alt="" className="h-14 w-14 opacity-70" />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
              Sin registros aún
            </h2>
            <p className="text-sm text-muted">Registrá este ejercicio en un entrenamiento para ver tu progreso.</p>
            <Link
              to="/workout/start"
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm text-white"
            >
              <img src={iconPlay} alt="" className="h-4 w-4" />
              Iniciar workout
            </Link>
          </div>
        )}

        {!isLoading && !historyQuery.isError && history.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatTileSmall label="PR · KG" value={best ? String(best.weight) : '—'} valueClassName="text-data" />
              <StatTileSmall
                label="1RM Est."
                value={best ? bestOneRmLabel(best) : '—'}
              />
              <StatTileSmall
                label="KG · 8SEM"
                value={eightWeekDelta ? `${eightWeekDelta.deltaKg > 0 ? '+' : ''}${eightWeekDelta.deltaKg}` : '—'}
                valueClassName={eightWeekDelta && eightWeekDelta.deltaKg > 0 ? 'text-positive' : undefined}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3">
              <div className="flex gap-1.5">
                {CHART_METRIC_TABS.map((tab) => (
                  <Chip key={tab.id} active={chartMetric === tab.id} onClick={() => setChartMetric(tab.id)}>
                    {tab.label}
                  </Chip>
                ))}
              </div>

              {chartPoints.length === 0 ? (
                <p className="text-sm text-muted">Todavía no hay sets completados para graficar.</p>
              ) : (
                <>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartPoints}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          stroke="#94a3b8"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <Tooltip labelFormatter={(value) => formatDate(String(value))} />
                        <Line
                          type="monotone"
                          dataKey={CHART_METRIC_TABS.find((tab) => tab.id === chartMetric)?.dataKey}
                          stroke="#2563eb"
                          dot={ChartDot}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {chartMetric === 'weight' && (
                    <p className="text-xs text-muted">
                      Se grafica el 1RM estimado (Brzycki). Los puntos claros son estimaciones de baja confianza (más
                      de 12 reps).
                    </p>
                  )}
                </>
              )}
            </div>

            <section className="flex flex-col gap-2">
              <h2 className="font-mono text-xs uppercase tracking-wide text-muted">Registro</h2>
              <ul className="flex flex-col gap-2">
                {registroRows.map((row) => (
                  <li
                    key={row.workoutId}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-muted">{formatDate(row.date)}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {row.setsCount} sets
                        {row.topSet ? ` · top ${row.topSet.weight}kg x ${row.topSet.reps}` : ''}
                      </span>
                    </div>
                    {row.isPr && (
                      <span className="rounded-full bg-positive/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-positive">
                        PR
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function bestOneRmLabel(best: CountableSet): string {
  const estimate = estimateOneRm(best.weight, best.reps)
  return estimate ? estimate.value.toFixed(0) : '—'
}

function StatTileSmall({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface px-2 py-3 text-center">
      <span className={valueClassName ? `font-mono text-xl font-bold ${valueClassName}` : 'font-mono text-xl font-bold text-foreground'}>
        {value}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </div>
  )
}
