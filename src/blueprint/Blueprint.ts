import { createEntity, Entity, EntityNumber, makeIntoEntity, PlainEntity, withEntityNumber } from "../entity/entity"
import { PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, mutableShallowCopy, shallowCopy } from "../lib/util"
import { table as utilTable } from "util"
import { PasteEntity } from "../entity/reference-entity"
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
export type MutablePasteBlueprint = MutableBlueprint<PasteEntity>

interface MutableBlueprintConstructor {
  new <E extends Entity = PlainEntity>(): MutableBlueprint<E>
  fromPlainEntities(entities: BlueprintEntityRead[]): MutableBlueprint
  fromEntities<E extends Entity>(entities: E[]): MutableBlueprint<E>
  copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E>
}

@Classes.register("Blueprint")
class BlueprintImpl<E extends Entity> implements MutableBlueprint<E> {
  entities: Record<EntityNumber, E> = {}
  private byPosition: PRecord<NumberPair, LuaSet<E>> = {}

  static fromPlainEntities(entities: readonly BlueprintEntityRead[]): MutableBlueprint {
    return BlueprintImpl.fromEntities(entities.map((e) => createEntity(e)))
  }

  static fromEntities<E extends Entity>(entities: E[]): MutableBlueprint<E> {
    const blueprint = new BlueprintImpl<E>()
    for (const entity of entities) {
      blueprint.addEntityUnchecked(entity, entity.entity_number)
    }
    return blueprint
  }

  static copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E> {
    const result = new BlueprintImpl<E>()
    result.entities = shallowCopy(blueprint.entities)
    result.recomputeByPosition()
    return result
  }

  static createInPlace(entities: BlueprintEntityRead[]): Blueprint {
    entities.forEach(makeIntoEntity)
    return BlueprintImpl.fromEntities(entities as Entity[])
  }

  private nextEntityNumber(): EntityNumber {
    return (luaLength(this.entities) + 1) as EntityNumber
  }

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(x), floor(y))]
  }

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(pos.x), floor(pos.y))]
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
      const tileBox = entity.tileBox
      expandTo(tileBox.left_top)
      expandTo(tileBox.right_bottom)
    }
    return bbox.fromCorners(minX, minY, maxX, maxY)
  }

  addSingle(entity: E): E {
    const number = this.nextEntityNumber()
    const newEntity = withEntityNumber(entity, number)
    return this.addEntityUnchecked(newEntity, number)
  }

  private addEntityUnchecked(entity: E, number: EntityNumber): E {
    this.entities[number] = entity
    for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
      const set = (this.byPosition[pair(x, y)] ??= new LuaSet())
      set.add(entity)
    }

    return entity
  }

  replaceUnsafe(old: E, cur: E): E {
    const number = old.entity_number
    if (this.entities[number] !== old)
      error("tried to replace entity that doesn't exist in blueprint: " + serpent.block(old))

    const newEntity = withEntityNumber(cur, number)
    this.entities[number] = newEntity
    for (const [x, y] of bbox.iterateTiles(newEntity.tileBox)) {
      const set = this.byPosition[pair(x, y)]!
      set.delete(old)
      set.add(newEntity)
    }

    return newEntity
  }

  remove(entity: E): E {
    const number = entity.entity_number
    const oldEntity = this.entities[number]
    if (oldEntity !== entity) error("tried to remove entity that doesn't exist in blueprint: " + serpent.block(entity))

    delete this.entities[number]
    for (const [x, y] of bbox.iterateTiles(oldEntity.tileBox)) {
      const index = pair(x, y)
      const set = this.byPosition[index]!
      set.delete(oldEntity)
      if (!set.first()) delete this.byPosition[index]
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
    result.recomputeByPosition()
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

  private recomputeByPosition(): void {
    this.byPosition = {}
    for (const [, entity] of pairs(this.entities)) {
      for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
        const set = (this.byPosition[pair(x, y)] ??= new LuaSet())
        set.add(entity)
      }
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

export const MutableBlueprint: MutableBlueprintConstructor = BlueprintImpl

export function getBlueprintFromWorld(
  surface: SurfaceIdentification,
  area: BoundingBoxRead,
  worldTopLeft: MapPositionTable = area.left_top,
): Blueprint {
  const entities = takeBlueprint(surface, area, worldTopLeft)
  return BlueprintImpl.createInPlace(entities)
}
