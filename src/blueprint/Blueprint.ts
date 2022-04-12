import { createEntity, Entity, EntityNumber, withEntityNumber } from "../entity/entity"
import { Mutable, PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox } from "../lib/geometry/bounding-box"
import { shallowCopy } from "../lib/util"
import { table as utilTable } from "util"
import floor = math.floor
import deepcopy = utilTable.deepcopy
import sort = table.sort

export interface Blueprint<E extends Entity = Entity> {
  readonly entities: RRecord<EntityNumber, E>

  getAtPos(x: number, y: number): LuaSet<E> | undefined
  getAt(pos: MapPositionTable): LuaSet<E> | undefined
}

export interface MutableBlueprint<E extends Entity = Entity> extends Blueprint<E> {
  // returns the new entity, which may have a different entity number
  addSingle(entity: E): E

  replaceUnsafe(old: E, cur: E): E

  remove(entity: E): E

  remapEntityNumbers(map: Record<number, number>): void

  sortEntities(): void
}

interface MutableBlueprintConstructor {
  new <E extends Entity = Entity>(): MutableBlueprint<E>
  fromEntities(entities: BlueprintEntityRead[]): MutableBlueprint
  copyOf<E extends Entity>(blueprint: Blueprint<E>): MutableBlueprint<E>
}

@Classes.register("Blueprint")
class BlueprintImpl<E extends Entity> implements MutableBlueprint<E> {
  entities: Record<EntityNumber, E> = {}
  private byPosition: PRecord<NumberPair, LuaSet<E>> = {}

  static fromEntities(entities: BlueprintEntityRead[]): MutableBlueprint {
    const blueprint = new BlueprintImpl<Entity>()
    for (const rawEntity of entities) {
      const entity = createEntity(rawEntity)
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

  private nextEntityNumber(): EntityNumber {
    return (luaLength(this.entities) + 1) as EntityNumber
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

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(x), floor(y))]
  }

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(pos.x), floor(pos.y))]
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

  remapEntityNumbers(map: Record<number, number>): void {
    const newEntities: Record<EntityNumber, E> = {}
    for (const [oldNumber, entity] of pairs(this.entities)) {
      const newNumber = map[oldNumber]
      if (newNumber === undefined) error("tried to remap entity number that doesn't exist: " + oldNumber)
      newEntities[newNumber as EntityNumber] = withEntityNumber(entity, newNumber as EntityNumber)
    }
    BlueprintImpl.remapConnections(newEntities, map)

    this.entities = newEntities
    this.recomputeByPosition()
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
    function remapEntityConnections(entity: Mutable<Entity>) {
      const connection = entity.connections
      if (connection === undefined) return
      const result = deepcopy(connection)
      remapConnectionPoint(result["1"])
      remapConnectionPoint(result["2"])
      entity.connections = result
    }

    for (const [, entity] of pairs(entities)) {
      remapEntityConnections(entity)
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

  sortEntities(): void {
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
    this.remapEntityNumbers(remap)
  }
}

export const MutableBlueprint: MutableBlueprintConstructor = BlueprintImpl
