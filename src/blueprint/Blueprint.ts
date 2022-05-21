import { Entity, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { Classes, shallowCopy } from "../lib"
import { BBox, bbox, Position } from "../lib/geometry"
import { add, get, Map2D, MutableMap2D } from "../lib/map2d"
import { takeBlueprint, takeBlueprintWithIndex } from "./world"
import contains = bbox.contains

@Classes.register("Blueprint")
export class Blueprint<E extends Entity = PlainEntity> implements Blueprint<E> {
  private byPosition?: Map2D<E>

  private constructor(public readonly entities: readonly E[]) {}

  static fromArray<E extends Entity>(entities: readonly E[]): Blueprint<E> {
    return new Blueprint(shallowCopy(entities))
  }

  static _new<E extends Entity>(entities: E[]): Blueprint<E> {
    return new Blueprint(entities)
  }

  static of<E extends Entity>(...entities: E[]): Blueprint<E> {
    return new Blueprint(entities)
  }

  static take(surface: SurfaceIdentification, area: BBox, worldTopLeft: Position = area.left_top): Blueprint {
    return new Blueprint(takeBlueprint(surface, area, worldTopLeft))
  }

  static takeWithSourceIndex(
    surface: SurfaceIdentification,
    area: BBox,
    worldTopLeft: Position = area.left_top,
  ): LuaMultiReturn<[Blueprint, Record<number, LuaEntity>]> {
    const [bp, index] = takeBlueprintWithIndex(surface, area, worldTopLeft)
    return $multi(new Blueprint(bp), index)
  }

  asArray(): readonly E[] {
    return this.entities as E[]
  }

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return get(this.getOrComputeByPosition(), x, y)
  }

  getAt(pos: Position): LuaSet<E> | undefined {
    return this.getAtPos(pos.x, pos.y)
  }

  getOrComputeByPosition(): Map2D<E> {
    return this.byPosition || (this.byPosition = this.doComputeByPosition())
  }

  private doComputeByPosition(): Map2D<E> {
    const result: MutableMap2D<E> = {}
    for (const entity of this.entities) {
      const { x, y } = entity.position
      add(result, x, y, entity)
    }
    return result
  }
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

export function filterEntitiesInArea<T extends Entity>(entities: readonly T[], area: BBox): T[] {
  return entities.filter((entity) => contains(area, entity.position))
}
