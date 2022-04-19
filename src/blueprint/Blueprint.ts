import {
  Entity,
  EntityNumber,
  getTileBox,
  PasteEntity,
  PlainEntity,
  remapEntityNumbersInArrayPosition,
  UpdateablePasteEntity,
  withEntityNumber,
} from "../entity/entity"
import { PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, shallowCopy } from "../lib/util"
import { takeBlueprint } from "../world-interaction/blueprint"
import floor = math.floor

export interface Blueprint<E extends Entity = PlainEntity> {
  readonly entities: RRecord<EntityNumber, E>

  getAtPos(x: number, y: number): ReadonlyLuaSet<E> | undefined
  getAt(pos: MapPositionTable): ReadonlyLuaSet<E> | undefined
  getAsArray(): readonly E[]
  computeBoundingBox(): BoundingBoxClass
}

export interface MutableBlueprint<E extends Entity = Entity> extends Blueprint<E> {
  // returns the new entity, which may have a different entity number
  addSingle(entity: E): E
  replaceUnsafe(old: E, cur: E): E
  remove(entity: E): E
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

interface MutableBlueprintConstructor {
  new <E extends Entity = PlainEntity>(): MutableBlueprint<E>
  fromArray(entities: BlueprintEntityRead[]): MutableBlueprint
  copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E>
}

@Classes.register("Blueprint")
class BlueprintImpl<E extends Entity> implements MutableBlueprint<E> {
  private byPosition?: PRecord<NumberPair, LuaSet<E>>

  constructor(public entities: Record<EntityNumber, E> = {}) {}

  static fromArray(entities: readonly BlueprintEntityRead[]): MutableBlueprint {
    return new BlueprintImpl(remapEntityNumbersInArrayPosition(entities))
  }

  static copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E> {
    return new BlueprintImpl<E>(shallowCopy(blueprint.entities))
  }

  static createInPlace(entities: BlueprintEntityRead[]): Blueprint {
    return new BlueprintImpl(entities as unknown as Record<EntityNumber, Entity>)
  }
  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.getOrComputeByPosition()[pair(floor(x), floor(y))]
  }

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.getOrComputeByPosition()[pair(floor(pos.x), floor(pos.y))]
  }

  private getOrComputeByPosition(): PRecord<NumberPair, LuaSet<E>> {
    return (this.byPosition ??= this.recomputeByPosition())
  }
  recomputeByPosition(): PRecord<NumberPair, LuaSet<E>> {
    const result: PRecord<NumberPair, LuaSet<E>> = {}
    for (const [, entity] of pairs(this.entities)) {
      addToByPosition(result, entity)
    }
    return result
  }

  getAsArray(): readonly E[] {
    return this.entities as unknown as E[]
  }

  computeBoundingBox(): BoundingBoxClass {
    if (isEmpty(this.entities)) {
      return bbox.fromCorners(0, 0, 0, 0)
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    function expandTo(pos: MapPositionTable) {
      if (pos.x < minX) minX = pos.x
      if (pos.y < minY) minY = pos.y
      if (pos.x > maxX) maxX = pos.x
      if (pos.y > maxY) maxY = pos.y
    }
    for (const [, entity] of pairs(this.entities)) {
      const tileBox = getTileBox(entity)
      expandTo(tileBox.left_top)
      expandTo(tileBox.right_bottom)
    }
    return bbox.fromCorners(minX, minY, maxX, maxY)
  }

  addSingle(rawEntity: E): E {
    const number = luaLength(this.entities) + 1
    const entity = withEntityNumber(rawEntity, number)
    this.entities[number] = entity

    const byPosition = this.byPosition
    if (byPosition) addToByPosition(byPosition, entity)

    return entity
  }

  replaceUnsafe(old: E, cur: E): E {
    const number = old.entity_number
    if (this.entities[number] !== old)
      error("tried to replace entity that doesn't exist in blueprint: " + serpent.block(old))

    const newEntity = withEntityNumber(cur, number)
    this.entities[number] = newEntity

    const byPosition = this.byPosition
    if (byPosition) {
      for (const [x, y] of bbox.iterateTiles(getTileBox(newEntity))) {
        const set = byPosition[pair(x, y)]!
        set.delete(old)
        set.add(newEntity)
      }
    }

    return newEntity
  }

  remove(entity: E): E {
    const number = entity.entity_number
    const oldEntity = this.entities[number]
    if (oldEntity !== entity) error("tried to remove entity that doesn't exist in blueprint: " + serpent.block(entity))

    delete this.entities[number]

    const byPosition = this.byPosition
    if (byPosition) {
      for (const [x, y] of bbox.iterateTiles(getTileBox(oldEntity))) {
        const index = pair(x, y)
        const set = byPosition[index]!
        set.delete(oldEntity)
        if (!set.first()) delete byPosition[index]
      }
    }

    return oldEntity
  }
}

function addToByPosition<E extends Entity>(byPosition: PRecord<NumberPair, LuaSet<E>>, entity: E) {
  for (const [x, y] of bbox.iterateTiles(getTileBox(entity))) {
    const set = (byPosition[pair(x, y)] ??= new LuaSet())
    set.add(entity)
  }
}

export const MutableBlueprint: MutableBlueprintConstructor = BlueprintImpl

export function getBlueprintFromWorld(
  surface: SurfaceIdentification,
  area: BoundingBoxRead,
  worldTopLeft: MapPositionTable = area.left_top,
): Blueprint {
  const entities = takeBlueprint(surface, area, worldTopLeft)
  return BlueprintImpl.createInPlace(entities)
}
