import { AnyEntity, BasicEntity, createBasicEntity, withEntityNumber } from "./Entity"
import { Classes } from "../lib"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { RRecord } from "../lib/util-types"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { mutate, shallowCopy } from "../lib/util"
import { pos } from "../lib/geometry/position"

export interface EntityGrid<E extends AnyEntity> {
  // todo: off grid entities
  readonly byPosition: RRecord<NumberPair, E>
  readonly byEntityNumber: RRecord<number, E>

  getAtPos(x: number, y: number): E | undefined
  getAsArray(): E[]

  computeBoundingBox(): BoundingBoxClass

  copy(): EntityGridBuilder<E>
}
const min = math.min
const max = math.max

@Classes.register()
export class EntityGridBuilder<E extends AnyEntity> implements EntityGrid<E> {
  private nextEntityNumber = 1
  byPosition: Record<NumberPair, E> = {}
  byEntityNumber: Record<number, E> = {}

  getAtPos(x: number, y: number): E | undefined {
    return this.byPosition[pair(x, y)]
  }

  getAsArray(): E[] {
    return this.byEntityNumber as any
  }

  computeBoundingBox(): BoundingBoxClass {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    function expandTo(position: MapPositionTable) {
      minX = min(minX, position.x)
      minY = min(minY, position.y)
      maxX = max(maxX, position.x)
      maxY = max(maxY, position.y)
    }
    for (const [, entity] of pairs(this.byEntityNumber)) {
      const bbox = entity.tileBox
      expandTo(bbox.left_top)
      expandTo(bbox.right_bottom)
    }
    return bbox.fromCorners(minX, minY, maxX, maxY)
  }

  copy(): EntityGridBuilder<E> {
    return EntityGridBuilder.from(this)
  }

  /** Does not check for collisions. */
  add(entity: E): this {
    const number = this.nextEntityNumber++
    const assemblyEntity = withEntityNumber(entity, number)
    this.byEntityNumber[number] = assemblyEntity
    for (const [x, y] of bbox.iterateTiles(assemblyEntity.tileBox)) {
      this.byPosition[pair(x, y)] = assemblyEntity
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
      error(`Tried to remove entity ${entity.entity_number} but it was not in the assembly`)
    }
    delete this.byEntityNumber[entity.entity_number]
    for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
      this.byPosition[pair(x, y)] = undefined!
    }
    return this
  }

  replaceUnsafe(oldEntity: E, newEntity: E): this {
    const existing = this.byEntityNumber[oldEntity.entity_number]
    if (existing !== oldEntity) {
      error(`Tried to replace entity ${oldEntity.entity_number} but it was not in the assembly`)
    }
    const result = withEntityNumber(newEntity, oldEntity.entity_number)
    this.byEntityNumber[oldEntity.entity_number] = result
    for (const [x, y] of bbox.iterateTiles(oldEntity.tileBox)) {
      this.byPosition[pair(x, y)] = result
    }
    return this
  }

  private recomputePositions(): void {
    this.byPosition = {}
    for (const [, entity] of pairs(this.byEntityNumber)) {
      for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
        this.byPosition[pair(x, y)] = entity
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

  withEntityNumberRemap(map: Record<number, number>): EntityGridBuilder<E> {
    const result = new EntityGridBuilder<E>()
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

  withCompactedEntityNumbers(): EntityGridBuilder<E> {
    let nextNumber = 1
    const map: Record<number, number> = {}
    for (const [number] of pairs(this.byEntityNumber)) {
      map[number] = nextNumber++
    }
    return this.withEntityNumberRemap(map)
  }

  static from<E extends AnyEntity>(assembly: EntityGrid<E>): EntityGridBuilder<E> {
    const builder = new EntityGridBuilder<E>()
    builder.byPosition = shallowCopy(assembly.byPosition)
    builder.byEntityNumber = shallowCopy(assembly.byEntityNumber)
    builder.nextEntityNumber = luaLength(assembly.byEntityNumber) + 1

    return builder
  }

  static fromBlueprint(entities: BlueprintEntityRead[]): EntityGridBuilder<BasicEntity> {
    const builder = new EntityGridBuilder<BasicEntity>()
    builder.addAll(entities.map((e) => createBasicEntity(e)))
    return builder
  }
}

export type Blueprint = EntityGrid<BasicEntity>
export type BlueprintPaste = EntityGrid<AnyEntity>
export interface BlueprintDiff {
  changes: BlueprintPaste
  deletions: Blueprint
}
