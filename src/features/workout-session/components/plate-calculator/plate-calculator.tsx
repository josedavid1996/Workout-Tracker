import { planPlates, warmupRamp } from '../../../../shared/lib/plates'
import { Sheet } from '../../../../shared/ui/sheet'
import { useUserEquipmentQuery } from '../../api/use-workout-session'

// Bar weight fallback matching `user_equipment.bar_weight`'s DB default
// (0001_core_schema.sql) — used only while no equipment row exists yet.
const DEFAULT_BAR_WEIGHT = 20

interface PlateCalculatorProps {
  open: boolean
  onClose: () => void
  targetWeight: number
}

// Fase 10 (equipment settings, PR5) does not exist in this PR — most users
// have no `user_equipment` row yet. `getUserEquipment()` already degrades
// that to `null`, and `planPlates` already returns `null` for "no
// inventory" (tested in `shared/lib/plates.test.ts`), so this component only
// needs to render that degraded state: warmup ramp always shown, plate
// breakdown shown only when inventory exists.
export function PlateCalculator({ open, onClose, targetWeight }: PlateCalculatorProps) {
  const { data: equipment } = useUserEquipmentQuery()

  const barWeight = equipment?.bar_weight ?? DEFAULT_BAR_WEIGHT
  const plan = planPlates(targetWeight, barWeight, equipment?.plate_inventory)
  const ramp = warmupRamp(targetWeight, barWeight)

  return (
    <Sheet open={open} onClose={onClose} title="Calculadora de discos">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-display text-xs uppercase tracking-wide text-muted">Rampa de calentamiento</span>
          <p className="font-mono text-foreground">{ramp.join(' → ')} kg</p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-display text-xs uppercase tracking-wide text-muted">
            Discos por lado (barra {barWeight}kg)
          </span>
          {plan ? (
            <>
              {plan.perSide.length === 0 ? (
                <p className="font-mono text-foreground">Sin discos — el objetivo es igual o menor a la barra.</p>
              ) : (
                <ul className="font-mono text-foreground">
                  {plan.perSide.map((plate) => (
                    <li key={plate.weight}>
                      {plate.qty} x {plate.weight}kg
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted">Peso alcanzado: {plan.achievedWeight}kg</p>
            </>
          ) : (
            <p className="text-sm text-muted">
              Todavía no configuraste tu inventario de discos — mostrando solo la rampa de calentamiento.
            </p>
          )}
        </div>
      </div>
    </Sheet>
  )
}
