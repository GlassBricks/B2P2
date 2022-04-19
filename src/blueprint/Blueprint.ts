import { Entity, getTileBox, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { PRecord, PRRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, mutableShallowCopy } from "../lib/util"
import { takeBlueprint } from "../world-interaction/blueprint"
import floor = math.floor
import iterateTiles = bbox.iterateTiles
import fromCorners = bbox.fromCorners

@Classes.register("Blueprint")
export class Blueprint<E extends BlueprintEntityRead = PlainEntity> implements Blueprint<E> {
  private byPosition?: PRRecord<NumberPair, LuaSet<E>>

  private constructor(readonly entities: Record<number, E>) {}

  static fromArray<E extends Entity>(entities: readonly E[]): Blueprint<E> {
    return new Blueprint(mutableShallowCopy(entities))
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

  asArray(): readonly E[] {
    return this.entities as E[]
  }

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.getOrComputeByPosition()[pair(floor(x), floor(y))]
  }

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.getOrComputeByPosition()[pair(floor(pos.x), floor(pos.y))]
  }

  getOrComputeByPosition(): PRRecord<NumberPair, LuaSet<E>> {
    return (this.byPosition ??= this.doComputeByPosition())
  }

  computeByPosition(): asserts this is { readonly byPosition: PRRecord<NumberPair, LuaSet<E>> } {
    this.getOrComputeByPosition()
  }

  private doComputeByPosition(): PRecord<NumberPair, LuaSet<E>> {
    const result: PRecord<NumberPair, MutableLuaSet<E>> = {}
    for (const [, entity] of pairs(this.entities)) {
      for (const [x, y] of iterateTiles(getTileBox(entity))) {
        const set = (result[pair(x, y)] ??= new LuaSet())
        set.add(entity)
      }
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
    for (const [, entity] of pairs(this.entities)) {
      const tileBox = getTileBox(entity)
      expandTo(tileBox.left_top)
      expandTo(tileBox.right_bottom)
    }
    return fromCorners(minX, minY, maxX, maxY)
  }
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>
