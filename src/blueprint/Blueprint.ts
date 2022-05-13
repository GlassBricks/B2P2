import { Entity, getTileBox, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { Classes } from "../lib"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { add, get, Map2D, MutableMap2D } from "../lib/map2d"
import { isEmpty, shallowCopy } from "../lib/util"
import { takeBlueprint, takeBlueprintWithIndex } from "./world"
import contains = bbox.contains
import fromCorners = bbox.fromCoords

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

  static take(
    surface: SurfaceIdentification,
    area: BoundingBoxRead,
    worldTopLeft: MapPositionTable = area.left_top,
  ): Blueprint {
    return new Blueprint(takeBlueprint(surface, area, worldTopLeft))
  }

  static takeWithSourceIndex(
    surface: SurfaceIdentification,
    area: BoundingBoxRead,
    worldTopLeft: MapPositionTable = area.left_top,
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

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
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

  computeBoundingBox(): BoundingBoxClass {
    if (isEmpty(this.entities)) {
      return fromCorners(0, 0, 0, 0)
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    function expandTo({ x, y }: MapPositionTable) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
    for (const entity of this.entities) {
      const tileBox = getTileBox(entity)
      expandTo(tileBox.left_top)
      expandTo(tileBox.right_bottom)
    }
    return fromCorners(minX, minY, maxX, maxY)
  }
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

export function filterEntitiesInArea<T extends Entity>(entities: readonly T[], area: BoundingBoxRead): T[] {
  return entities.filter((entity) => {
    const entityBox = getTileBox(entity)
    return contains(area, entityBox.left_top) && contains(area, entityBox.right_bottom)
  })
}
