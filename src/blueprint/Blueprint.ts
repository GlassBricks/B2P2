import { Entity, getTileBox, PasteEntity, PlainEntity, UpdateablePasteEntity } from "../entity/entity"
import { Classes } from "../lib"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { isEmpty, shallowCopy } from "../lib/util"
import { PRecord, PRRecord } from "../lib/util-types"
import { takeBlueprint } from "./world"
import fromCorners = bbox.fromCoords
import iterateTiles = bbox.iterateTiles
import floor = math.floor

@Classes.register("Blueprint")
export class Blueprint<E extends Entity = PlainEntity> implements Blueprint<E> {
  private byPosition?: PRRecord<NumberPair, LuaSet<E>>

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
    return this.byPosition || (this.byPosition = this.doComputeByPosition())
  }

  computeByPosition(): asserts this is { readonly byPosition: PRRecord<NumberPair, LuaSet<E>> } {
    this.getOrComputeByPosition()
  }

  private doComputeByPosition(): PRecord<NumberPair, LuaSet<E>> {
    const result: PRecord<NumberPair, MutableLuaSet<E>> = {}
    for (const entity of this.entities) {
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
