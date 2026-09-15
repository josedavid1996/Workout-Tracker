import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import iconEmptyList from '../../../assets/icons/icon-empty-list.svg'
import iconEmptyRings from '../../../assets/icons/icon-empty-rings.svg'
import iconPlus from '../../../assets/icons/icon-plus.svg'
import iconSearch from '../../../assets/icons/icon-search.svg'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { Chip } from '../../../shared/ui/chip'
import { IconButton } from '../../../shared/ui/icon-button'
import { Input } from '../../../shared/ui/input'
import { useExercisesByIdsQuery } from '../../exercises/api/use-exercises'
import { useWorkoutHistoryQuery } from '../../history/api/use-history'
import { daysSince } from '../../../shared/lib/days-since'
import type { RoutineListCardData } from '../components/routine-list-card'
import { RoutineListCard } from '../components/routine-list-card'
import { filterRoutinesByName } from '../lib/filter-routines'
import { dominantBodyPart, estimateWorkoutMinutes } from '../lib/routine-summary'
import { useDeleteRoutineMutation, useRoutinesWithExercisesQuery } from '../api/use-routines'

const FEATURED_EXERCISE_CHIPS = 2

// `/routines` — real layout per `design/figma-reference/02-lista-rutinas.md`:
// filter tabs derived from the user's actual routines (never hardcoded
// Push/Pull/Legs), routine cards with a real "hace Nd"/"nunca" badge and
// exercise-name chips. `fetchRoutinesWithExercises` gives each routine's
// `exercise_id`s; names/body_part are resolved via the existing
// `useExercisesByIdsQuery` (already used by the workout summary page).
export function RoutinesListPage() {
  const routinesQuery = useRoutinesWithExercisesQuery()
  const historyQuery = useWorkoutHistoryQuery()
  const deleteMutation = useDeleteRoutineMutation()

  const [activeBodyPart, setActiveBodyPart] = useState<string | 'all'>('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const routines = useMemo(() => routinesQuery.data ?? [], [routinesQuery.data])
  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data])

  const allExerciseIds = useMemo(
    () =>
      Array.from(
        new Set(routines.flatMap((routine) => routine.routine_exercises.map((exercise) => exercise.exercise_id))),
      ),
    [routines],
  )
  const exercisesQuery = useExercisesByIdsQuery(allExerciseIds)
  const exercisesById = useMemo(() => {
    const map = new Map<string, { name: string; body_part: string | null }>()
    for (const exercise of exercisesQuery.data ?? []) {
      map.set(exercise.id, { name: exercise.name, body_part: exercise.body_part })
    }
    return map
  }, [exercisesQuery.data])

  const mostRecentUsedRoutineId = history.find((item) => item.routineId !== null)?.routineId ?? null

  const routineSummaries: (RoutineListCardData & { dominantBodyPart: string | null })[] = useMemo(
    () =>
      routines.map((routine) => {
        const orderedExercises = routine.routine_exercises.slice().sort((a, b) => a.position - b.position)
        const resolved = orderedExercises.map((exercise) => exercisesById.get(exercise.exercise_id))
        const exerciseNames = resolved
          .slice(0, FEATURED_EXERCISE_CHIPS)
          .map((exercise) => exercise?.name)
          .filter((name): name is string => Boolean(name))
        const bodyParts = resolved.map((exercise) => exercise?.body_part ?? null)

        const lastUsedHistoryItem = history.find((item) => item.routineId === routine.id)

        return {
          id: routine.id,
          name: routine.name,
          exerciseCount: orderedExercises.length,
          estimatedMinutes: estimateWorkoutMinutes(orderedExercises.length),
          exerciseNames,
          extraExerciseCount: Math.max(0, orderedExercises.length - FEATURED_EXERCISE_CHIPS),
          daysSinceUsed: lastUsedHistoryItem ? daysSince(lastUsedHistoryItem.createdAt) : null,
          isMostRecent: routine.id === mostRecentUsedRoutineId,
          dominantBodyPart: dominantBodyPart(bodyParts),
        }
      }),
    [routines, exercisesById, history, mostRecentUsedRoutineId],
  )

  const bodyPartTabs = useMemo(
    () =>
      Array.from(
        new Set(routineSummaries.map((routine) => routine.dominantBodyPart).filter((value): value is string => Boolean(value))),
      ),
    [routineSummaries],
  )

  const bodyPartFilteredRoutines =
    activeBodyPart === 'all'
      ? routineSummaries
      : routineSummaries.filter((routine) => routine.dominantBodyPart === activeBodyPart)
  const filteredRoutines = filterRoutinesByName(bodyPartFilteredRoutines, searchQuery)

  const isLoading = routinesQuery.isLoading
  const hasNoRoutines = !isLoading && routines.length === 0

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">Rutinas</h1>
          <div className="flex items-center gap-2">
            <IconButton
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              aria-pressed={searchOpen}
              onClick={() => setSearchOpen((open) => !open)}
            >
              <img src={iconSearch} alt="" className="h-4 w-4" />
            </IconButton>
            <Link
              to="/routines/new"
              aria-label="Nueva rutina"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white"
            >
              <img src={iconPlus} alt="" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {searchOpen && (
          <Input
            aria-label="Buscar rutina"
            autoFocus
            placeholder="Buscar rutina..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        )}

        {isLoading && <p className="text-muted">Cargando...</p>}
        {routinesQuery.isError && <p className="text-red-400">No se pudieron cargar las rutinas.</p>}
        {deleteMutation.isError && (
          <p className="text-red-400">No se pudo eliminar la rutina. Probá de nuevo.</p>
        )}

        {hasNoRoutines && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-8 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <img src={iconEmptyRings} alt="" className="absolute h-16 w-16 opacity-60" />
              <img src={iconEmptyList} alt="" className="relative h-6 w-6" />
            </div>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-wide text-foreground">
              Ninguna rutina
            </h2>
            <p className="text-sm text-muted">Creá tu primera rutina para empezar a entrenar.</p>
            <Link to="/routines/new">
              <Button className="flex items-center gap-2">
                <img src={iconPlus} alt="" className="h-4 w-4" />
                Nueva rutina
              </Button>
            </Link>
          </div>
        )}

        {!hasNoRoutines && !isLoading && (
          <>
            {bodyPartTabs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Chip active={activeBodyPart === 'all'} onClick={() => setActiveBodyPart('all')}>
                  Todas
                </Chip>
                {bodyPartTabs.map((bodyPart) => (
                  <Chip
                    key={bodyPart}
                    active={activeBodyPart === bodyPart}
                    onClick={() => setActiveBodyPart(bodyPart)}
                  >
                    {bodyPart}
                  </Chip>
                ))}
              </div>
            )}

            {filteredRoutines.length === 0 && searchQuery.trim() && (
              <p className="text-sm text-muted">No se encontraron rutinas para "{searchQuery.trim()}".</p>
            )}

            <ul className="flex flex-col gap-3">
              {filteredRoutines.map((routine) => (
                <li key={routine.id}>
                  <RoutineListCard
                    routine={routine}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    deleteDisabled={deleteMutation.isPending}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
