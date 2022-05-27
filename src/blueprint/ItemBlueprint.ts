import { FullEntity } from "../entity/entity"
import { Classes } from "../lib"
import { BBox, pos, Position } from "../lib/geometry"
import { Blueprint } from "./Blueprint"
import { allocateBPItemStack, freeBPItemStack } from "./blueprint-items"
import { getShiftedEntities, takeBlueprintUntranslated } from "./world"

@Classes.registerIn("Blueprint", "ItemBlueprint")
export class ItemBlueprint implements Blueprint {
  private stack: BlueprintItemStack | undefined
  private posToShift: Position | undefined
  private constructor(stack: BlueprintItemStack) {
    this.stack = stack
  }

  static new(surface: SurfaceIdentification, area: BBox, worldTopLeft: Position = area.left_top): ItemBlueprint {
    const stack = allocateBPItemStack()
    const result = new ItemBlueprint(stack)
    try {
      result.retake(surface, area, worldTopLeft)
    } catch (e) {
      result.delete()
      throw e
    }
    return result
  }

  getStack(): BlueprintItemStack | undefined {
    if (this.posToShift) this.shiftEntities()
    return this.stack
  }

  getEntities(): FullEntity[] {
    const stack = this.stack
    if (!stack) return []
    if (!this.posToShift) {
      return stack.get_blueprint_entities() ?? []
    }
    return this.shiftEntities()
  }

  private shiftEntities(): FullEntity[] {
    const stack = this.stack!
    const entities = getShiftedEntities(stack, this.posToShift!)
    delete this.posToShift
    return entities
  }

  private retake(surface: SurfaceIdentification, area: BBox, worldTopLeft: Position = area.left_top): boolean {
    const stack = this.stack
    if (!stack) return false
    const [, targetPos] = takeBlueprintUntranslated(stack, surface, area, worldTopLeft)
    if (!pos.isZero(targetPos)) {
      this.posToShift = targetPos
    }
    return true
  }

  delete(): void {
    if (!this.stack) return
    freeBPItemStack(this.stack)
    this.stack = undefined
    this.posToShift = undefined
  }
}
