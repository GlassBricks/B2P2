import { Entity, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { Classes, shallowCopy } from "../lib"
import { BBox, bbox, Position } from "../lib/geometry"
import { Map2D } from "../lib/map2d"
import { Blueprint, createEntityPositionMap } from "./Blueprint"
import { getTempBpItemStack } from "./blueprint-items"
import { takeBlueprintWithIndex } from "./world"
import contains = bbox.contains

@Classes.registerIn("Blueprint", "Blueprint")
export class LuaBlueprint<E extends Entity = PlainEntity> implements Blueprint<E> {
  protected constructor(protected readonly entities: readonly E[]) {}

  static fromArray<E extends Entity>(entities: readonly E[]): LuaBlueprint<E> {
    return new LuaBlueprint(shallowCopy(entities))
  }

  static _new<E extends Entity>(entities: E[]): LuaBlueprint<E> {
    return new LuaBlueprint(entities)
  }

  static of<E extends Entity>(...entities: E[]): LuaBlueprint<E> {
    return new LuaBlueprint(entities)
  }

  static take(surface: SurfaceIdentification, area: BBox, worldTopLeft: Position = area.left_top): LuaBlueprint {
    const [entities] = takeBlueprintWithIndex(surface, area, worldTopLeft)
    return new LuaBlueprint(entities)
  }

  getEntities(): readonly E[] {
    return this.entities as E[]
  }

  getStack(): BlueprintItemStack | undefined {
    if (!this.entities[0]) return
    const stack = getTempBpItemStack()
    stack.set_blueprint_entities(this.entities as any)
    return stack
  }

  private byPosition?: Map2D<E>

  getEntitiesAndPositionMap(): LuaMultiReturn<[readonly E[], Map2D<E>]> {
    const byPosition = this.byPosition ?? (this.byPosition = createEntityPositionMap(this.entities))
    return $multi(this.entities, byPosition)
  }
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

export function filterEntitiesInArea<T extends Entity>(entities: readonly T[], area: BBox): T[] {
  return entities.filter((entity) => contains(area, entity.position))
}
