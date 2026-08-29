import { useState } from 'react'
import { BottomNav } from '../../../shared/ui/bottom-nav'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import type { PlateInventory } from '../../../shared/lib/plates'
import { useSaveUserEquipmentMutation, useUserEquipmentQuery } from '../api/use-equipment'

// Matches `user_equipment.bar_weight`'s DB default (0001_core_schema.sql) —
// used only while no equipment row has been saved yet.
const DEFAULT_BAR_WEIGHT = 20

type PlateRow = { weight: number; count: number }

// `/settings/equipment`: bar weight + an editable list of available plates
// (weight/count pairs, add/remove rows). Saving upserts `user_equipment`
// (PK is `user_id`, so this is always either the user's first row or an
// edit of their existing one). Once saved, `planPlates()`
// (`shared/lib/plates.ts`, PR2) — already wired into the plate calculator
// via `getUserEquipment()` (PR4) — starts finding a real inventory instead
// of degrading to "ramp only".
export function EquipmentSettingsPage() {
  const equipmentQuery = useUserEquipmentQuery()
  const saveMutation = useSaveUserEquipmentMutation()

  // `null` = "not edited by the user yet" — the fetched row (or defaults, if
  // none exists) is derived during render instead of copied into state via
  // an effect. Once the user edits a field, the local override takes over
  // for the rest of the session.
  const [barWeightOverride, setBarWeightOverride] = useState<number | null>(null)
  const [platesOverride, setPlatesOverride] = useState<PlateRow[] | null>(null)

  const barWeight = barWeightOverride ?? equipmentQuery.data?.bar_weight ?? DEFAULT_BAR_WEIGHT
  const plates = platesOverride ?? equipmentQuery.data?.plate_inventory ?? []

  function addPlateRow() {
    setPlatesOverride([...plates, { weight: 0, count: 0 }])
  }

  function removePlateRow(index: number) {
    setPlatesOverride(plates.filter((_, i) => i !== index))
  }

  function updatePlateRow(index: number, patch: Partial<PlateRow>) {
    setPlatesOverride(plates.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function handleSave() {
    const inventory: PlateInventory = plates.filter((row) => row.weight > 0 && row.count > 0)
    saveMutation.mutate({ barWeight, plateInventory: inventory })
  }

  return (
    <div className="min-h-dvh bg-background px-4 pb-28 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <h1 className="font-display text-2xl uppercase tracking-wide text-foreground">Equipo</h1>

        {equipmentQuery.isLoading && <p className="text-muted">Cargando...</p>}

        <Input
          label="Peso de la barra (kg)"
          type="number"
          value={barWeight}
          onChange={(event) => setBarWeightOverride(Number(event.target.value))}
        />

        <div className="flex flex-col gap-2">
          <span className="font-display text-sm uppercase tracking-wide text-muted">Discos disponibles</span>

          {plates.length === 0 && (
            <p className="text-sm text-muted">Todavía no agregaste discos.</p>
          )}

          <ul className="flex flex-col gap-2">
            {plates.map((plate, index) => (
              <li key={index} className="flex items-end gap-2">
                <Input
                  label="Peso (kg)"
                  type="number"
                  value={plate.weight}
                  onChange={(event) => updatePlateRow(index, { weight: Number(event.target.value) })}
                />
                <Input
                  label="Cantidad"
                  type="number"
                  value={plate.count}
                  onChange={(event) => updatePlateRow(index, { count: Number(event.target.value) })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removePlateRow(index)}>
                  Quitar
                </Button>
              </li>
            ))}
          </ul>

          <Button type="button" variant="secondary" size="sm" onClick={addPlateRow}>
            Agregar disco
          </Button>
        </div>

        <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
        </Button>

        {saveMutation.isSuccess && <p className="text-sm text-accent">Guardado.</p>}
        {saveMutation.isError && <p className="text-sm text-red-400">No se pudo guardar el equipo.</p>}
      </div>

      <BottomNav />
    </div>
  )
}
