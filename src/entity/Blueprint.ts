import { AnyEntity, BasicEntity, createBasicEntity, DeleteEntity, UpdateEntity, withEntityNumber } from "./Entity"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { Mutable, RRecord } from "../lib/util-types"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { isEmpty, mutate, shallowCopy } from "../lib/util"
import { pos } from "../lib/geometry/position"

export interface Blueprint<E extends AnyEntity> {
  // todo: off grid entities
  readonly byPosition: RRecord<NumberPair, ReadonlyLuaSet<E>>
  readonly entities: RRecord<number, E>

  getAt(pos: MapPositionTable): ReadonlyLuaSet<E> | undefined
  getAtPos(x: number, y: number): ReadonlyLuaSet<E> | undefined
  asArray(): readonly E[]

  computeBoundingBox(): BoundingBoxClass

  copy(): MutableBlueprint<AnyEntity>
}
const min = math.min
const max = math.max
const floor = math.floor

@Classes.register()
export class MutableBlueprint<E extends AnyEntity> implements Blueprint<E> {
  private nextEntityNumber = 1
  byPosition: Record<NumberPair, LuaSet<E>> = {}
  entities: Record<number, E> = {}

  getAt(pos: MapPositionTable): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(pos.x), floor(pos.y))]
  }

  getAtPos(x: number, y: number): LuaSet<E> | undefined {
    return this.byPosition[pair(floor(x), floor(y))]
  }

  asArray(): E[] {
    return this.entities as any
  }

  computeBoundingBox(): BoundingBoxClass {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [, entity] of pairs(this.entities)) {
      const bbox = entity.tileBox
      const { left_top, right_bottom } = bbox
      minX = min(minX, left_top.x)
      minY = min(minY, left_top.y)
      maxX = max(maxX, right_bottom.x)
      maxY = max(maxY, right_bottom.y)
    }
    return bbox.fromCorners(minX, minY, maxX, maxY)
  }

  copy(): MutableBlueprint<AnyEntity> {
    return MutableBlueprint.copyOf<AnyEntity>(this)
  }

  /** Does not check for collisions. */
  add(entity: E): this {
    const number = this.nextEntityNumber++
    const assemblyEntity = withEntityNumber(entity, number)
    this.entities[number] = assemblyEntity
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
    const existing = this.entities[entity.entity_number]
    if (existing !== entity) {
      error(`Tried to remove entity ${entity.entity_number} but it was not in the blueprint`)
    }
    delete this.entities[entity.entity_number]
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
    const existing = this.entities[oldEntity.entity_number]
    if (existing !== oldEntity) {
      error(`Tried to replace entity ${oldEntity.entity_number} but it was not in the blueprint`)
    }
    const result = withEntityNumber(newEntity, oldEntity.entity_number)
    this.entities[oldEntity.entity_number] = result
    for (const [x, y] of bbox.iterateTiles(oldEntity.tileBox)) {
      const set = this.byPosition[pair(x, y)]
      set.delete(oldEntity)
      set.add(result)
    }
    return this
  }

  private recomputePositions(): void {
    this.byPosition = {}
    for (const [, entity] of pairs(this.entities)) {
      for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
        const set = (this.byPosition[pair(x, y)] ??= new LuaSet())
        set.add(entity)
      }
    }
  }

  shiftAll(by: MapPositionTable): this {
    for (const [, entity] of pairs(this.entities)) {
      this.entities[entity.entity_number] = mutate(entity, (e) => {
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

  withEntityNumberRemap(map: Record<number, number>): MutableBlueprint<E> {
    const result = new MutableBlueprint<E>()
    for (const [number, entity] of pairs(this.entities)) {
      const newNumber = map[number]
      if (newNumber === undefined) {
        error(`Tried to remap entity number ${entity.entity_number} but it was not in the mapping`)
      }
      result.entities[newNumber] = withEntityNumber(entity, newNumber)
    }
    // todo: remap circuit connection numbers
    result.recomputePositions()
    result.nextEntityNumber = luaLength(result.entities) + 1
    return result
  }

  withCompactedEntityNumbers(): MutableBlueprint<E> {
    let nextNumber = 1
    const map: Record<number, number> = {}
    for (const [number] of pairs(this.entities)) {
      map[number] = nextNumber++
    }
    return this.withEntityNumberRemap(map)
  }

  static copyOf<E extends AnyEntity>(assembly: Blueprint<E>): MutableBlueprint<E> {
    const builder = new MutableBlueprint<E>()
    builder.byPosition = shallowCopy(assembly.byPosition) as any
    builder.entities = shallowCopy(assembly.entities)
    builder.nextEntityNumber = luaLength(assembly.entities) + 1

    return builder
  }

  static fromEntities(entities: BlueprintEntityRead[]): MutableBlueprint<BasicEntity> {
    const builder = new MutableBlueprint<BasicEntity>()
    builder.addAll(entities.map((e) => createBasicEntity(e)))
    return builder
  }
}

export function filterBlueprint<E extends AnyEntity, T extends E>(
  blueprint: Blueprint<E>,
  predicate: (entity: E) => entity is T,
): MutableBlueprint<T>
export function filterBlueprint<E extends AnyEntity>(
  blueprint: Blueprint<E>,
  predicate: (entity: E) => boolean,
): MutableBlueprint<E>
export function filterBlueprint<E extends AnyEntity>(
  blueprint: Blueprint<E>,
  predicate: (entity: E) => boolean,
): MutableBlueprint<E> {
  const builder = new MutableBlueprint<E>()
  for (const [, entity] of pairs(blueprint.entities)) {
    if (predicate(entity)) {
      builder.add(entity)
    }
  }
  return builder
}

export type BasicBlueprint = Blueprint<BasicEntity>
export type BlueprintPaste = Blueprint<BasicEntity | UpdateEntity>
export type BlueprintDiff = Blueprint<BasicEntity | UpdateEntity | DeleteEntity>
export type MutableBasicBlueprint = MutableBlueprint<BasicEntity>
export type MutableBlueprintPaste = MutableBlueprint<BasicEntity | UpdateEntity>
export type MutableBlueprintDiff = MutableBlueprint<BasicEntity | UpdateEntity | DeleteEntity>

export type Creator<E extends AnyEntity> = new () => MutableBlueprint<E>
export const MutableBasicBlueprint: Creator<BasicEntity> = MutableBlueprint
export const MutableBlueprintPaste: Creator<BasicEntity | UpdateEntity> = MutableBlueprint
export const MutableBlueprintDiff: Creator<BasicEntity | UpdateEntity | DeleteEntity> = MutableBlueprint
