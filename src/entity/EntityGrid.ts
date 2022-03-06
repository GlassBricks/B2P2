import { AnyEntity, BasicEntity, createBasicEntity, DeleteEntity, UpdateEntity, withEntityNumber } from "./Entity"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { RRecord } from "../lib/util-types"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, mutate, shallowCopy } from "../lib/util"
import { pos } from "../lib/geometry/position"

export interface EntityGrid<E extends AnyEntity> {
  // todo: off grid entities
  readonly byPosition: RRecord<NumberPair, LuaSet<E>>
  readonly byEntityNumber: RRecord<number, E>

  getAt(pos: MapPositionTable): LuaSet<E> | undefined
  getAtPos(x: number, y: number): LuaSet<E> | undefined
  asArray(): E[]

  computeBoundingBox(): BoundingBoxClass

  copy(): MutableEntityGrid<E>
}
const min = math.min
const max = math.max
const floor = math.floor

@Classes.register()
export class MutableEntityGrid<E extends AnyEntity> implements EntityGrid<E> {
  private nextEntityNumber = 1
  byPosition: Record<NumberPair, LuaSet<E>> = {}
  byEntityNumber: Record<number, E> = {}

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(pos.x), floor(pos.y))]
  }

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(x), floor(y))]
  }

  asArray(): E[] {
    return this.byEntityNumber as any
  }

  computeBoundingBox(): BoundingBoxClass {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [, entity] of pairs(this.byEntityNumber)) {
      const bbox = entity.tileBox
      const { left_top, right_bottom } = bbox
      minX = min(minX, left_top.x)
      minY = min(minY, left_top.y)
      maxX = max(maxX, right_bottom.x)
      maxY = max(maxY, right_bottom.y)
    }
    return bbox.fromCorners(minX, minY, maxX, maxY)
  }

  copy(): MutableEntityGrid<E> {
    return MutableEntityGrid.from(this)
  }

  /** Does not check for collisions. */
  add(entity: E): this {
    const number = this.nextEntityNumber++
    const assemblyEntity = withEntityNumber(entity, number)
    this.byEntityNumber[number] = assemblyEntity
    for (const [x, y] of bbox.iterateTiles(assemblyEntity.tileBox)) {
      const set = (this.byPosition[pair(x, y)] ??= new LuaSet())
      set.add(assemblyEntity)
    }
    return this
  }

  addAll(entities: E[]): this {
    for (const entity of entities) {
      this.add(entity)
    }
    // todo: circuit connection logic, etc.

    return this
  }

  remove(entity: E): this {
    const existing = this.byEntityNumber[entity.entity_number]
    if (existing !== entity) {
      error(`Tried to remove entity ${entity.entity_number} but it was not in the blueprint`)
    }
    delete this.byEntityNumber[entity.entity_number]
    for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
      const p = pair(x, y)
      const set = this.byPosition[p]
      if (set) {
        set.delete(entity)
        if (isEmpty(set)) {
          delete this.byPosition[p]
        }
      }
    }
    return this
  }

  replaceUnsafe(oldEntity: E, newEntity: E): this {
    const existing = this.byEntityNumber[oldEntity.entity_number]
    if (existing !== oldEntity) {
      error(`Tried to replace entity ${oldEntity.entity_number} but it was not in the blueprint`)
    }
    const result = withEntityNumber(newEntity, oldEntity.entity_number)
    this.byEntityNumber[oldEntity.entity_number] = result
    for (const [x, y] of bbox.iterateTiles(oldEntity.tileBox)) {
      const set = this.byPosition[pair(x, y)]
      set.delete(oldEntity)
      set.add(result)
    }
    return this
  }

  private recomputePositions(): void {
    this.byPosition = {}
    for (const [, entity] of pairs(this.byEntityNumber)) {
      for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
        const set = (this.byPosition[pair(x, y)] ??= new LuaSet())
        set.add(entity)
      }
    }
  }

  shiftAll(by: MapPositionTable): this {
    for (const [, entity] of pairs(this.byEntityNumber)) {
      this.byEntityNumber[entity.entity_number] = mutate(entity, (e) => {
        e.tileBox = bbox.shift(e.tileBox, by)
        e.position = pos.add(e.position, by)
      })
    }
    this.recomputePositions()
    return this
  }

  shiftToOrigin(): this {
    const bbox = this.computeBoundingBox()
    const by = pos.times(bbox.left_top, -1)
    // debugPrint("Shifting to origin, by ", pos)
    return this.shiftAll(by)
  }

  withEntityNumberRemap(map: Record<number, number>): MutableEntityGrid<E> {
    const result = new MutableEntityGrid<E>()
    for (const [number, entity] of pairs(this.byEntityNumber)) {
      const newNumber = map[number]
      if (newNumber === undefined) {
        error(`Tried to remap entity number ${entity.entity_number} but it was not in the mapping`)
      }
      result.byEntityNumber[newNumber] = withEntityNumber(entity, newNumber)
    }
    // todo: remap circuit connection numbers
    result.recomputePositions()
    result.nextEntityNumber = luaLength(result.byEntityNumber) + 1
    return result
  }

  withCompactedEntityNumbers(): MutableEntityGrid<E> {
    let nextNumber = 1
    const map: Record<number, number> = {}
    for (const [number] of pairs(this.byEntityNumber)) {
      map[number] = nextNumber++
    }
    return this.withEntityNumberRemap(map)
  }

  static from<E extends AnyEntity>(assembly: EntityGrid<E>): MutableEntityGrid<E> {
    const builder = new MutableEntityGrid<E>()
    builder.byPosition = shallowCopy(assembly.byPosition)
    builder.byEntityNumber = shallowCopy(assembly.byEntityNumber)
    builder.nextEntityNumber = luaLength(assembly.byEntityNumber) + 1

    return builder
  }

  static fromBlueprint(entities: BlueprintEntityRead[]): MutableEntityGrid<BasicEntity> {
    const builder = new MutableEntityGrid<BasicEntity>()
    builder.addAll(entities.map((e) => createBasicEntity(e)))
    return builder
  }
}

export type BasicBlueprint = EntityGrid<BasicEntity>
export type BlueprintPaste = EntityGrid<BasicEntity | UpdateEntity>
export type BlueprintDiff = EntityGrid<BasicEntity | UpdateEntity | DeleteEntity>
type Creator<E extends AnyEntity> = new () => MutableEntityGrid<E>
export const MutableBasicBlueprint: Creator<BasicEntity> = MutableEntityGrid
export const MutableBlueprintPaste: Creator<BasicEntity | UpdateEntity> = MutableEntityGrid
export const MutableBlueprintDiff: Creator<BasicEntity | UpdateEntity | DeleteEntity> = MutableEntityGrid
