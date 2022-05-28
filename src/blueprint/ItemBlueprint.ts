import { EntityNumber, FullEntity, PlainEntity } from "../entity/entity"
import { Classes } from "../lib"
import { BBox, pos, Position } from "../lib/geometry"
import { Map2D } from "../lib/map2d"
import { Blueprint, createEntityPositionMap } from "./Blueprint"
import { allocateBPItemStack, freeBPItemStack } from "./blueprint-items"
import { getShiftedEntities, takeBlueprintUntranslated } from "./world"

@Classes.registerIn("Blueprint", "ItemBlueprint")
export class ItemBlueprint implements Blueprint {
  private stack: BlueprintItemStack | undefined
  private posToShift: Position | undefined
  private constructor(stack: BlueprintItemStack) {
    this.stack = stack
  }

  static newWithIndex(
    surface: SurfaceIdentification,
    area: BBox,
    worldTopLeft: Position = area.left_top,
  ): LuaMultiReturn<[ItemBlueprint, Record<number, LuaEntity>]> {
    const stack = allocateBPItemStack()
    const result = new ItemBlueprint(stack)
    let index: Record<EntityNumber, LuaEntity>
    try {
      index = result.retake(surface, area, worldTopLeft)
    } catch (e) {
      result.delete()
      throw e
    }
    return $multi(result, index)
  }

  static empty(): ItemBlueprint {
    return new ItemBlueprint(allocateBPItemStack())
  }

  static from(bp: Blueprint): ItemBlueprint {
    const stack = allocateBPItemStack()
    const result = new ItemBlueprint(stack)
    result.set(bp.getEntities())
    return result
  }

  static new(surface: SurfaceIdentification, area: BBox, worldTopLeft: Position = area.left_top): ItemBlueprint {
    const [item] = ItemBlueprint.newWithIndex(surface, area, worldTopLeft)
    return item
  }

  getStack(): BlueprintItemStack | undefined {
    if (this.posToShift) this.shiftEntities()
    return this.stack
  }

  getEntities(): FullEntity[] {
    const stack = this.stack
    if (!stack) return []
    if (!this.posToShift) return stack.get_blueprint_entities() ?? []
    return this.shiftEntities()
  }

  getEntitiesAndPositionMap(): LuaMultiReturn<[readonly PlainEntity[], Map2D<PlainEntity>]> {
    const entities = this.getEntities()
    const map = createEntityPositionMap(entities)
    return $multi(entities, map)
  }

  private shiftEntities(): FullEntity[] {
    const stack = this.stack!
    const entities = getShiftedEntities(stack, this.posToShift!)
    stack.set_blueprint_entities(entities)
    delete this.posToShift
    return entities
  }

  public retake(
    surface: SurfaceIdentification,
    area: BBox,
    worldTopLeft: Position = area.left_top,
  ): Record<EntityNumber, LuaEntity> {
    const stack = this.stack
    if (!stack) return {}
    const [index, targetPos] = takeBlueprintUntranslated(stack, surface, area, worldTopLeft)
    if (!pos.isZero(targetPos)) {
      this.posToShift = targetPos
    }
    return index
  }

  public set(entities: readonly FullEntity[]): void {
    if (!this.stack) return
    this.stack.set_blueprint_entities(entities)
    this.posToShift = undefined
  }

  delete(): void {
    if (!this.stack) return
    freeBPItemStack(this.stack)
    this.stack = undefined
    this.posToShift = undefined
  }
}
