import iconEquipAccessory from '../../../assets/icons/icon-equip-accessory.svg'
import iconEquipBodyweight from '../../../assets/icons/icon-equip-bodyweight.svg'
import iconEquipCable from '../../../assets/icons/icon-equip-cable.svg'
import iconEquipCardio from '../../../assets/icons/icon-equip-cardio.svg'
import iconEquipFreeweight from '../../../assets/icons/icon-equip-freeweight.svg'
import iconEquipMachine from '../../../assets/icons/icon-equip-machine.svg'
import type { EquipmentCategory } from './equipment-category'

// Extracted from `workout-session/components/exercise-picker/exercise-picker.tsx`
// (PR7) so it can be reused by `quick-reference-sheet.tsx` (PR10) without
// duplicating the `Record` literal. Pure data, no new logic.
export const EQUIPMENT_CATEGORY_ICONS: Record<EquipmentCategory, string> = {
  freeweight: iconEquipFreeweight,
  machine: iconEquipMachine,
  cable: iconEquipCable,
  bodyweight: iconEquipBodyweight,
  cardio: iconEquipCardio,
  accessory: iconEquipAccessory,
}
