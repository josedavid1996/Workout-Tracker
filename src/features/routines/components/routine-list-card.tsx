import { Link } from 'react-router-dom'
import { cx } from '../../../shared/lib/cx'
import { Button } from '../../../shared/ui/button'
import iconRemove from '../../../assets/icons/icon-remove.svg'

export interface RoutineListCardData {
  id: string
  name: string
  exerciseCount: number
  estimatedMinutes: number
  exerciseNames: string[]
  extraExerciseCount: number
  // null = never used (no finished workout for this routine yet).
  daysSinceUsed: number | null
  // Only the single globally-most-recently-used routine gets the green
  // "reciente" badge (per `02-lista-rutinas.md`) — every other routine
  // (even with a valid days-since value) gets the neutral gray badge.
  isMostRecent: boolean
}

interface RoutineListCardProps {
  routine: RoutineListCardData
  onDelete: (id: string) => void
  deleteDisabled?: boolean
}

// One implementation of the repeated routine-card pattern from
// `02-lista-rutinas.md` — currently used only by `/routines`, but kept as
// its own component (not inlined in the page) since the Figma "hoy toca"
// card on Home shares its visual language (surface/border/rounded-2xl,
// mono subtitle, badge) even though its content differs enough to stay a
// separate component for now.
export function RoutineListCard({ routine, onDelete, deleteDisabled }: RoutineListCardProps) {
  const neverUsed = routine.daysSinceUsed === null

  const badgeLabel = neverUsed ? 'NUNCA' : `HACE ${routine.daysSinceUsed}D`
  const badgeClassName =
    !neverUsed && routine.isMostRecent
      ? 'bg-positive/10 text-positive'
      : 'bg-surface-2 text-muted'

  return (
    <div
      className={cx(
        'flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4',
        neverUsed && 'opacity-85',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link to={`/routines/${routine.id}/edit`} className="flex-1">
          <span className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
            {routine.name}
          </span>
          <p className="font-mono text-xs text-muted">
            {routine.exerciseCount} EJERCICIOS · ~{routine.estimatedMinutes} MIN
          </p>
        </Link>
        <div className="flex items-center gap-2">
          <span className={cx('rounded-full px-2 py-0.5 font-mono text-[10px] uppercase', badgeClassName)}>
            {badgeLabel}
          </span>
          <button
            type="button"
            aria-label={`Eliminar ${routine.name}`}
            onClick={() => onDelete(routine.id)}
            disabled={deleteDisabled}
            className="rounded-full p-1 text-muted hover:text-red-400 disabled:opacity-50"
          >
            <img src={iconRemove} alt="" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {routine.exerciseNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {routine.exerciseNames.map((exerciseName) => (
            <span
              key={exerciseName}
              className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted"
            >
              {exerciseName}
            </span>
          ))}
          {routine.extraExerciseCount > 0 && (
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted">
              +{routine.extraExerciseCount}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Link to={`/history?routineId=${routine.id}`}>
          <Button variant="ghost" size="sm">
            Historial
          </Button>
        </Link>
      </div>
    </div>
  )
}
