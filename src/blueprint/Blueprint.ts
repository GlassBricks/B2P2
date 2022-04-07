import { Entity, EntityId, withEntityId } from "../entity/entity"
import { PRecord, RRecord } from "../lib/util-types"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { bbox } from "../lib/geometry/bounding-box"
import floor = math.floor

export interface Blueprint<E extends Entity = Entity> {
  readonly entities: RRecord<EntityId, E>

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
  readonly entities: Record<EntityId, E> = {}
  private readonly byPosition: PRecord<NumberPair, LuaSet<E>> = {}

  private nextEntityId(): EntityId {
    return (luaLength(this.entities) + 1) as EntityId
  }

  addSingle(entity: E): E {
    const id = this.nextEntityId()
    const newEntity = withEntityId(entity, id)
    return this.addEntityUnchecked(newEntity, id)
  }

  private addEntityUnchecked(entity: E, id: EntityId): E {
    this.entities[id] = entity
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
    const id = old.id
    if (this.entities[id] !== old)
      error("tried to replace entity that doesn't exist in blueprint: " + serpent.block(old))

    const newEntity = withEntityId(cur, id)
    this.entities[id] = newEntity
    for (const [x, y] of bbox.iterateTiles(newEntity.tileBox)) {
      const set = this.byPosition[pair(x, y)]!
      set.delete(old)
      set.add(newEntity)
    }

    return newEntity
  }

  remove(entity: E): E {
    const id = entity.id
    if (this.entities[id] !== entity)
      error("tried to remove entity that doesn't exist in blueprint: " + serpent.block(entity))

    const oldEntity = this.entities[id]
    delete this.entities[id]
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
