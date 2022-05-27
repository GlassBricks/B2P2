import { Entity, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { Classes, getAllInstances, shallowCopy } from "../lib"
import { BBox, bbox } from "../lib/geometry"
import { Map2D } from "../lib/map2d"
import { Migrations } from "../lib/migration"
import { Blueprint } from "./Blueprint"
import { getTempBpItemStack } from "./blueprint-items"
import contains = bbox.contains

@Classes.registerIn("Blueprint", "Blueprint")
export class LuaBlueprint<E extends Entity = PlainEntity> implements Blueprint<E> {
  private constructor(private readonly entities: readonly E[]) {}

  static fromArray<E extends Entity>(entities: readonly E[]): LuaBlueprint<E> {
    return new LuaBlueprint(shallowCopy(entities))
  }

  static _new<E extends Entity>(entities: E[]): LuaBlueprint<E> {
    return new LuaBlueprint(entities)
  }

  static of<E extends Entity>(...entities: E[]): LuaBlueprint<E> {
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
}

Migrations.since("0.3.0", () => {
  interface OldLuaBlueprint {
    byPosition?: Map2D<any>
  }
  for (const bp of getAllInstances(LuaBlueprint)) {
    delete (bp as OldLuaBlueprint).byPosition
  }
})

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

export function filterEntitiesInArea<T extends Entity>(entities: readonly T[], area: BBox): T[] {
  return entities.filter((entity) => contains(area, entity.position))
}
