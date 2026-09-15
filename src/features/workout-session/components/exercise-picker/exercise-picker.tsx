import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '../../../exercises/api/exercises'
import { useExerciseSearchQuery, useRelatedExercisesQuery } from '../../../exercises/api/use-exercises'
import type { EquipmentCategory } from '../../../exercises/lib/equipment-category'
import {
  EQUIPMENT_CATEGORIES,
  equipmentCategoryLabel,
  rawEquipmentValuesForCategory,
} from '../../../exercises/lib/equipment-category'
import { EQUIPMENT_CATEGORY_ICONS } from '../../../exercises/lib/equipment-icons'
import { ExerciseThumbnail } from '../../../exercises/components/exercise-thumbnail'
import { QuickReferenceSheet } from '../../../exercises/components/quick-reference-sheet'
import { Input } from '../../../../shared/ui/input'
import { Sheet } from '../../../../shared/ui/sheet'
import { Chip } from '../../../../shared/ui/chip'
import { IconButton } from '../../../../shared/ui/icon-button'
import { cx } from '../../../../shared/lib/cx'
import { useDebouncedValue } from '../../../../shared/lib/use-debounced-value'
import iconAddSmall from '../../../../assets/icons/icon-add-small.svg'
import iconSearch from '../../../../assets/icons/icon-search.svg'
import {
  EXERCISE_BODY_PART_OPTIONS,
  EXERCISE_CATEGORY_OPTIONS,
} from './exercise-filter-options'

const DEBOUNCE_MS = 300

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  // Present when the picker is opened from the context of an exercise
  // already chosen elsewhere (e.g. "swap exercise") — enables the
  // "related" suggestions section.
  relatedTo?: { muscleGroup: string; excludeId: string }
}

function ExerciseResultItem({
  exercise,
  onSelect,
  compact,
}: {
  exercise: Exercise
  onSelect: (exercise: Exercise) => void
  compact?: boolean
}) {
  const [quickReferenceOpen, setQuickReferenceOpen] = useState(false)
  return (
    <li className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect(exercise)}
        className={cx(
          'flex w-full items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-left hover:border-accent/60',
          compact && 'border-transparent bg-transparent px-0 py-1.5',
        )}
      >
        <ExerciseThumbnail
          src={exercise.image}
          alt=""
          className={cx(
            'shrink-0 rounded-md border border-border bg-surface-2',
            compact ? 'h-8 w-8' : 'h-10 w-10',
          )}
        />
        <div className="flex flex-1 flex-col">
          <span className="text-foreground">{exercise.name}</span>
          {!compact && (
            <span className="font-mono text-xs text-muted">
              {[exercise.muscle_group, exercise.equipment].filter(Boolean).join(' · ') || '—'}
            </span>
          )}
        </div>
        {compact && <img src={iconAddSmall} alt="" className="h-4 w-4 shrink-0" />}
      </button>
      {/* "?" quick-reference trigger — a nested <button> inside the row's
          <button> would be invalid HTML, so it's rendered as a sibling here
          and `stopPropagation`'d to avoid also firing `onSelect`. */}
      <IconButton
        size="sm"
        aria-label={`Referencia rápida: ${exercise.name}`}
        onClick={(event) => {
          event.stopPropagation()
          setQuickReferenceOpen(true)
        }}
      >
        ?
      </IconButton>
      <QuickReferenceSheet
        exerciseId={exercise.id}
        exercise={exercise}
        open={quickReferenceOpen}
        onClose={() => setQuickReferenceOpen(false)}
      />
    </li>
  )
}

// Reusable exercise search/filter overlay, consumed by both
// `routine-form-page.tsx` (adding an exercise to a routine) and the
// workout-session pages (adding an exercise to a freestyle workout).
// Styled per `design/figma-reference/04-selector-ejercicio.md`. Selection
// stays single-pick-and-close (unlike the Figma mock's multi-select +
// footer "Agregar N ejercicios" — both real consumers of this component
// expect `onSelect` to fire once per pick, so that contract was kept as-is;
// see PR7 apply-progress for this documented deviation).
export function ExercisePicker({ open, onClose, onSelect, relatedTo }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [bodyPart, setBodyPart] = useState<string | undefined>(undefined)
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory | undefined>(undefined)

  const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS)

  const searchQuery = useExerciseSearchQuery({
    name: debouncedSearch || undefined,
    category,
    bodyPart,
    equipment: equipmentCategory ? rawEquipmentValuesForCategory(equipmentCategory) : undefined,
  })
  const relatedQuery = useRelatedExercisesQuery(relatedTo?.muscleGroup, relatedTo?.excludeId)

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreSentinelRef = useRef<HTMLLIElement | null>(null)
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = searchQuery

  // Infinite scroll: fetch the next page of results once the sentinel row
  // at the bottom of the list scrolls into view within the picker's own
  // scroll container (not the window — this list scrolls inside the Sheet).
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { root: scrollContainerRef.current, rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  if (!open) return null

  const results = searchQuery.data?.pages.flat() ?? []
  const related = (relatedQuery.data as Exercise[] | undefined) ?? []

  return (
    <Sheet open={open} onClose={onClose} title="Agregar ejercicio">
      <div ref={scrollContainerRef} className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
        <div className="relative">
          <img src={iconSearch} alt="" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-60" />
          <Input
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        {/* Not in the Figma mock (which only shows PARTE DEL CUERPO + EQUIPO)
            — kept because it is real, already-tested filter behavior over
            `exercises.category`, not something this PR should remove. */}
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">Categoría</span>
          <div className="flex flex-wrap gap-1.5">
            {EXERCISE_CATEGORY_OPTIONS.map((option) => (
              <Chip
                key={option}
                active={category === option}
                onClick={() => setCategory(category === option ? undefined : option)}
              >
                {option}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Parte del cuerpo · {EXERCISE_BODY_PART_OPTIONS.length}
          </span>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto">
            {EXERCISE_BODY_PART_OPTIONS.map((option) => (
              <Chip
                key={option}
                active={bodyPart === option}
                onClick={() => setBodyPart(bodyPart === option ? undefined : option)}
              >
                {option}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted">
            Equipo · {EQUIPMENT_CATEGORIES.length} grupos
          </span>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto">
            {EQUIPMENT_CATEGORIES.map((option) => (
              <Chip
                key={option}
                active={equipmentCategory === option}
                icon={<img src={EQUIPMENT_CATEGORY_ICONS[option]} alt="" className="h-3.5 w-3.5" />}
                onClick={() => setEquipmentCategory(equipmentCategory === option ? undefined : option)}
              >
                {equipmentCategoryLabel(option)}
              </Chip>
            ))}
          </div>
        </div>

        <span className="font-mono text-xs text-muted">
          {searchQuery.isLoading ? 'Buscando…' : `${results.length}${hasNextPage ? '+' : ''} resultados`}
        </span>

        {relatedTo && related.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg bg-[#182236] px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-wide text-muted">
              Relacionados · {relatedTo.muscleGroup}
            </span>
            <span className="font-mono text-[10px] text-muted">Limit 6</span>
            <ul className="flex flex-col divide-y divide-border/50">
              {related.map((exercise) => (
                <ExerciseResultItem key={exercise.id} exercise={exercise} onSelect={onSelect} compact />
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {!searchQuery.isLoading && results.length === 0 && (
            <p className="text-sm text-muted">No se encontraron ejercicios.</p>
          )}
          <ul className="flex flex-col gap-2">
            {results.map((exercise) => (
              <ExerciseResultItem key={exercise.id} exercise={exercise} onSelect={onSelect} />
            ))}
            {hasNextPage && (
              <li ref={loadMoreSentinelRef} className="py-1 text-center font-mono text-xs text-muted">
                {isFetchingNextPage ? 'Cargando más…' : ''}
              </li>
            )}
          </ul>
        </div>
      </div>
    </Sheet>
  )
}
