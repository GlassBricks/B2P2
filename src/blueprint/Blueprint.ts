import { Entity, FullEntity, PlainEntity } from "../entity/entity"
import { add, Map2D, MutableMap2D } from "../lib/map2d"

export interface Blueprint<T extends Entity = PlainEntity> {
  /**
   * The item stack should be used READ only. It may be an actual item or a temporary item stack.
   */
  getStack(this: Blueprint<FullEntity>): BlueprintItemStack | undefined

  getEntities(): readonly T[]
}

export function prepareBlueprintStack(stack: BlueprintItemStack): void {
  stack.set_stack("blueprint")
  stack.blueprint_snap_to_grid = [2, 2]
  stack.blueprint_absolute_snapping = true
}

export function createEntityMap<E extends Entity>(entities: readonly E[]): Map2D<E> {
  const result: MutableMap2D<E> = {}
  for (const entity of entities) {
    const { x, y } = entity.position
    add(result, x, y, entity)
  }
  return result
}
