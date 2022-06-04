import { deepCompare, Mutable, PRecord, RRecord, shallowCompareRecords, shallowCopy } from "../lib"
import { pos, Position, UP } from "../lib/geometry"
import {
  Entity,
  EntityNumber,
  FullEntity,
  IgnoredProps,
  PartialEntity,
  PasteEntity,
  ReferenceEntity,
  UpdateablePasteEntity,
  UpdateableProp,
} from "./entity"
import { getEntityInfo } from "./entity-info"

export function isCompatibleEntity(a: Entity, b: Entity, bPosition: Position = b.position): boolean {
  if (!pos.equals(a.position, bPosition)) return false

  const aInfo = getEntityInfo(a.name)
  const bInfo = getEntityInfo(b.name)
  if (aInfo.entityGroup !== bInfo.entityGroup) return false

  return aInfo.isRotationPasteable || (a.direction ?? UP) === (b.direction ?? UP)
}

const IgnoredPropsAsRecord: Record<string, true> = IgnoredProps

export function createReferenceOnlyEntity(entity: Entity): ReferenceEntity {
  const result = shallowCopy(entity) as Mutable<ReferenceEntity>
  result.changedProps = new LuaSet<UpdateableProp>()
  return result
}
export interface EntityChanged<T> {
  readonly below: FullEntity
  readonly above: PasteEntity
  readonly fromValue: T
  readonly toValue: T
}
export type Upgrade = EntityChanged<string>
export type ItemsChange = EntityChanged<RRecord<string, number> | undefined>
/**
 * Performance hotspot
 *
 * This does several functions in one, for efficiency:
 *
 * - The result of pasting the above onto below entity is applied to the below entity.
 * - If the above is a reference entity, the unpasted props of it are set to the below entity.
 * - Returns if the entity was upgraded or item requests have changed.
 */
export function applyEntityPaste(
  below: PartialEntity,
  above: UpdateablePasteEntity,
): LuaMultiReturn<[upgrade?: Upgrade, itemsChange?: ItemsChange]> {
  const { changedProps } = above

  const upgraded: Upgrade | undefined =
    (changedProps === undefined || changedProps.has("name")) && above.name !== below.name
      ? {
          below,
          above,
          fromValue: below.name,
          toValue: above.name,
        }
      : undefined
  const itemsChanged: ItemsChange | undefined =
    (changedProps === undefined || changedProps.has("items")) && !shallowCompareRecords(above.items, below.items)
      ? {
          below,
          above,
          fromValue: below.items,
          toValue: above.items,
        }
      : undefined

  for (const [prop, belowValue] of pairs(below)) {
    if (IgnoredPropsAsRecord[prop] === undefined) {
      if (changedProps === undefined || changedProps.has(prop)) {
        // set in below
        below[prop] = above[prop] as never
      } else {
        // set in above
        above[prop] = belowValue as never
      }
    }
  }
  for (const [prop, aboveValue] of pairs(above)) {
    if (IgnoredPropsAsRecord[prop] === undefined && below[prop] === undefined) {
      if (changedProps === undefined || changedProps.has(prop)) {
        // set in below
        below[prop] = aboveValue as never
      } else {
        // set in above
        above[prop] = undefined!
      }
    }
  }
  return $multi(upgraded, itemsChanged)
}

export function computeEntityDiff(
  before: FullEntity,
  after: FullEntity,
  entityNumberMap: Record<EntityNumber, EntityNumber>, // from before to after
): ReferenceEntity | undefined {
  const changedProps = new LuaSet<UpdateableProp>()
  for (const [prop, value] of pairs(after)) {
    if (!(prop in IgnoredProps || deepCompare(before[prop], value))) {
      changedProps.add(prop as UpdateableProp)
    }
  }
  for (const [prop] of pairs(before)) {
    if (!(prop in after || prop in IgnoredProps)) {
      changedProps.add(prop as UpdateableProp)
    }
  }

  const circuitConnections = compareBlueprintCircuitConnection(before.connections, after.connections, entityNumberMap)
  if (circuitConnections) {
    changedProps.add("connections")
  }

  if (!changedProps.first()) return undefined

  const result = shallowCopy(after) as Mutable<ReferenceEntity>
  result.connections = circuitConnections
  result.changedProps = changedProps
  return result
}

// only gives NEW connections
function compareBlueprintCircuitConnection(
  old: BlueprintCircuitConnection | undefined,
  cur: BlueprintCircuitConnection | undefined,
  entityNumberMap: Record<EntityNumber, EntityNumber>,
): BlueprintCircuitConnection | undefined {
  if (cur === undefined) return undefined
  if (old === undefined) return cur
  const c1 = compareConnectionPoint(old["1"], cur["1"], entityNumberMap),
    c2 = compareConnectionPoint(old["2"], cur["2"], entityNumberMap)
  if (c1 === undefined && c2 === undefined) return undefined
  return { "1": c1, "2": c2 }
}

function compareConnectionPoint(
  old: BlueprintConnectionPoint | undefined,
  cur: BlueprintConnectionPoint | undefined,
  entityNumberMap: Record<EntityNumber, EntityNumber>,
): BlueprintConnectionPoint | undefined {
  if (cur === undefined) return undefined
  if (old === undefined) return cur
  const red = compareConnectionData(old.red, cur.red, entityNumberMap),
    green = compareConnectionData(old.green, cur.green, entityNumberMap)
  if (red === undefined && green === undefined) return undefined
  return { red, green }
}

function compareConnectionData(
  old: BlueprintConnectionData[] | undefined,
  cur: BlueprintConnectionData[] | undefined,
  entityNumberMap: PRecord<EntityNumber, EntityNumber>, // from before to after
): BlueprintConnectionData[] | undefined {
  if (cur === undefined) return undefined
  if (old === undefined) return cur

  const result: BlueprintConnectionData[] = []

  const oldSet: Record<number, Record<number, true>> = {}
  for (const data of old) {
    const entityId = entityNumberMap[data.entity_id]
    if (entityId !== undefined) {
      ;(oldSet[entityId] ?? (oldSet[entityId] = {}))[data.circuit_id || 0] = true
    }
    // else: not relevant
  }
  for (const data of cur) {
    const below = oldSet[data.entity_id]
    if (below === undefined || !((data.circuit_id || 0) in below)) {
      result.push(data)
    }
  }
  return result[0] && result
}
