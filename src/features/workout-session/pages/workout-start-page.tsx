import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import iconChevronRight from '../../../assets/icons/icon-chevron-right.svg'
import iconDecorRings from '../../../assets/icons/icon-decor-rings.svg'
import iconEmptyRings from '../../../assets/icons/icon-empty-rings.svg'
import iconPlay from '../../../assets/icons/icon-play.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconRoutineList from '../../../assets/icons/icon-routine-list.svg'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { estimateWorkoutMinutes } from '../../routines/lib/routine-summary'
import { useRoutinesWithExercisesQuery } from '../../routines/api/use-routines'
import { useActiveWorkoutQuery, useStartWorkoutMutation } from '../api/use-workout-session'

// `/workout/start` — real layout per `design/figma-reference/05-iniciar-workout.md`:
// a featured Freestyle card (with the decorative concentric-circles motif —
// confirmed to be part of the real design, not exclusive to the old
// brass/gold brief) plus a compact chevron-list of saved routines. Redirects
// straight into the already-active workout instead of allowing a second one
// (at most one, enforced by `workouts_single_active_idx`).
export function WorkoutStartPage() {
  const navigate = useNavigate()
  const routinesQuery = useRoutinesWithExercisesQuery()
  const activeWorkoutQuery = useActiveWorkoutQuery()
  const startMutation = useStartWorkoutMutation()

  useEffect(() => {
    if (activeWorkoutQuery.data) {
      navigate(`/workout/${activeWorkoutQuery.data.id}`, { replace: true })
    }
  }, [activeWorkoutQuery.data, navigate])

  async function handleStart(routineId: string | null) {
    const workout = await startMutation.mutateAsync(routineId)
    navigate(`/workout/${workout.id}`)
  }

  if (activeWorkoutQuery.isLoading || activeWorkoutQuery.data) {
    return <p className="p-6 text-muted">Cargando...</p>
  }

  const routines = routinesQuery.data ?? []
  const hasRoutines = routines.length > 0

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">Iniciar</h1>

        <button
          type="button"
          onClick={() => handleStart(null)}
          disabled={startMutation.isPending}
          className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface p-5 text-left disabled:opacity-60"
        >
          <img
            src={iconDecorRings}
            alt=""
            className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 opacity-25"
          />
          <div className="relative flex flex-col gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent">
              <img src={iconPlay} alt="" className="h-5 w-5" />
            </span>
            <span className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
              Freestyle
            </span>
            <span className="text-sm text-muted">Entrená sin una rutina planificada.</span>
          </div>
        </button>

        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          {hasRoutines ? 'O elegí una rutina' : 'Rutinas guardadas'}
        </span>

        {routinesQuery.isLoading && <p className="text-muted">Cargando rutinas...</p>}

        {!routinesQuery.isLoading && hasRoutines && (
          <ul className="flex flex-col gap-2">
            {routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => handleStart(routine.id)}
                  disabled={startMutation.isPending}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                    <img src={iconRoutineList} alt="" className="h-5 w-5 opacity-80" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-display text-lg font-bold uppercase tracking-wide text-foreground">
                      {routine.name}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {routine.routine_exercises.length} EJ · ~{estimateWorkoutMinutes(routine.routine_exercises.length)} MIN
                    </span>
                  </span>
                  <img src={iconChevronRight} alt="" className="h-4 w-4 shrink-0 opacity-60" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {!routinesQuery.isLoading && !hasRoutines && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <img src={iconEmptyRings} alt="" className="h-16 w-16 opacity-60" />
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
              Aún no tienes rutinas
            </h2>
            <p className="text-sm text-muted">Creá una rutina para poder elegirla acá la próxima vez.</p>
            <Link to="/routines/new">
              <Button variant="secondary" className="flex items-center gap-2 text-data">
                <img src={iconPlus} alt="" className="h-4 w-4" />
                Crear rutina
              </Button>
            </Link>
          </div>
        )}

        {startMutation.isError && (
          <p className="text-sm text-red-400">No se pudo empezar el entrenamiento. Probá de nuevo.</p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
