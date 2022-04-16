import {
  Entity,
  EntityNumber,
  getTileBox,
  PasteEntity,
  PlainEntity,
  UpdateablePasteEntity,
  withEntityNumber,
} from "../entity/entity"
import { PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, mutableShallowCopy, shallowCopy } from "../lib/util"
import { table as utilTable } from "util"
import { takeBlueprint } from "../world-interaction/blueprint"
import floor = math.floor
import deepcopy = utilTable.deepcopy
import sort = table.sort

export interface Blueprint<E extends Entity = PlainEntity> {
  readonly entities: RRecord<EntityNumber, E>

  getAtPos(x: number, y: number): ReadonlyLuaSet<E> | undefined
  getAt(pos: MapPositionTable): ReadonlyLuaSet<E> | undefined
  getAsArray(): readonly Entity[]
  computeBoundingBox(): BoundingBoxClass

  withEntityNumberRemap(map: Record<number, number>): Blueprint<E>
  sorted(): Blueprint<E>
}

export interface MutableBlueprint<E extends Entity = Entity> extends Blueprint<E> {
  // returns the new entity, which may have a different entity number
  addSingle(entity: E): E
  replaceUnsafe(old: E, cur: E): E
  remove(entity: E): E

  withEntityNumberRemap(map: Record<number, number>): MutableBlueprint<E>
  sorted(): MutableBlueprint<E>
}

export type PasteBlueprint = Blueprint<PasteEntity>
export type UpdateablePasteBlueprint = Blueprint<UpdateablePasteEntity>

interface MutableBlueprintConstructor {
  new <E extends Entity = PlainEntity>(): MutableBlueprint<E>
  fromPlainEntities(entities: BlueprintEntityRead[]): MutableBlueprint
  copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E>
}

@Classes.register("Blueprint")
class BlueprintImpl<E extends Entity> implements MutableBlueprint<E> {
  private byPosition?: PRecord<NumberPair, LuaSet<E>>

  constructor(public entities: Record<EntityNumber, E> = {}) {}

  static fromPlainEntities(entities: readonly BlueprintEntityRead[]): MutableBlueprint {
    return new BlueprintImpl(shallowCopy(entities))
  }

  static copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E> {
    return new BlueprintImpl<E>(shallowCopy(blueprint.entities))
  }

  static createInPlace(entities: BlueprintEntityRead[]): Blueprint {
    return new BlueprintImpl(entities as unknown as Record<EntityNumber, Entity>)
  }

  private nextEntityNumber(): EntityNumber {
    return (luaLength(this.entities) + 1) as EntityNumber
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

  getAsArray(): readonly Entity[] {
    return this.entities as unknown as Entity[]
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
    const number = this.nextEntityNumber()
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

  withEntityNumberRemap(map: Record<number, number>): MutableBlueprint<E> {
    const newEntities: Record<EntityNumber, E> = {}
    for (const [oldNumber, entity] of pairs(this.entities)) {
      const newNumber = map[oldNumber]
      if (newNumber === undefined) error("tried to remap entity number that doesn't exist: " + oldNumber)
      newEntities[newNumber as EntityNumber] = withEntityNumber(entity, newNumber as EntityNumber)
    }
    BlueprintImpl.remapConnections(newEntities, map)
    const result = new BlueprintImpl<E>()
    result.entities = newEntities
    return result
  }

  private static remapConnections(entities: Record<EntityNumber, Entity>, map: Record<number, number>): void {
    function remapConnectionData(connectionPoint: BlueprintConnectionData[] | undefined): void {
      if (connectionPoint === undefined) return
      for (const point of connectionPoint) {
        point.entity_id = map[point.entity_id]
      }
    }
    function remapConnectionPoint(connectionPoint: BlueprintConnectionPoint | undefined): void {
      if (connectionPoint === undefined) return
      remapConnectionData(connectionPoint.red)
      remapConnectionData(connectionPoint.green)
    }

    for (const [key, entity] of pairs(entities)) {
      const connection = entity.connections
      const neighbours = entity.neighbours
      if (connection === undefined && neighbours === undefined) continue

      const result = mutableShallowCopy(entity)
      if (connection !== undefined) {
        const resultConnection = deepcopy(connection)
        remapConnectionPoint(resultConnection["1"])
        remapConnectionPoint(resultConnection["2"])
        result.connections = resultConnection
      }
      if (neighbours !== undefined) {
        result.neighbours = neighbours.map((n) => map[n])
      }
      entities[key] = result
    }
  }

  sorted(): MutableBlueprint<E> {
    const entities = Object.values(this.entities)
    const compareByPosition = ({ position: a }: Entity, { position: b }: Entity): boolean => {
      if (a.y !== b.y) return a.y < b.y
      return a.x < b.x
    }
    sort(entities, compareByPosition)
    const remap: Record<EntityNumber, number> = {}
    for (const [newNumber, entity] of ipairs(entities)) {
      remap[entity.entity_number] = newNumber
    }
    return this.withEntityNumberRemap(remap)
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
