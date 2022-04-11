import { Entity, EntityNumber, withEntityNumber } from "../entity/entity"
import { PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox } from "../lib/geometry/bounding-box"
import floor = math.floor

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
}

@Classes.register("Blueprint")
class BlueprintImpl<E extends Entity> implements MutableBlueprint<E> {
  readonly entities: Record<EntityNumber, E> = {}
  private readonly byPosition: PRecord<NumberPair, LuaSet<E>> = {}

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
    if (this.entities[number] !== entity)
      error("tried to remove entity that doesn't exist in blueprint: " + serpent.block(entity))

    const oldEntity = this.entities[number]
    delete this.entities[number]
    for (const [x, y] of bbox.iterateTiles(oldEntity.tileBox)) {
      const index = pair(x, y)
      const set = this.byPosition[index]!
      set.delete(oldEntity)
      if (!set.first()) delete this.byPosition[index]
    }

    return oldEntity
  }
}

export const MutableBlueprint: new <E extends Entity>() => MutableBlueprint<E> = BlueprintImpl
