import { deepCompare, shallowCopy } from "../lib/util"
import { Mutable, PRecord } from "../lib/util-types"
import {
  ConflictingProp,
  Entity,
  EntityNumber,
  FullEntity,
  IgnoredProps,
  KnownProps,
  PlainEntity,
  ReferenceEntity,
  UnhandledProp,
  UpdateablePasteEntity,
  UpdateableProp,
  UpdateableReferenceEntity,
} from "./entity"
import { pos } from "../lib/geometry/position"
import { getEntityInfo } from "./entity-info"
import { UP } from "../lib/geometry/rotation"

export function isCompatibleEntity(a: Entity, b: Entity): boolean {
  if (!pos.equals(a.position, b.position)) return false

  const aInfo = getEntityInfo(a.name)
  const bInfo = getEntityInfo(b.name)
  if (aInfo.entityGroup !== bInfo.entityGroup) return false

  return aInfo.isRotationPasteable || (a.direction ?? UP) === (b.direction ?? UP)
}

function findConflictsAndUpdateReferenceEntity(
  below: FullEntity,
  above: UpdateableReferenceEntity,
): ConflictingProp | undefined {
  const { changedProps } = above
  // set values of props not in changedProps
  for (const [prop, value] of pairs(below)) {
    if (!(prop in IgnoredProps || changedProps.has(prop))) {
      above[prop] = value as never
    }
  }
  for (const [prop] of pairs(above)) {
    if (!(prop in below || prop in IgnoredProps || changedProps.has(prop))) {
      above[prop] = undefined!
    }
  }

  // check for conflicts
  if (above.changedProps.has("name")) {
    if (below.name !== above.name) return "name"
  }
  if (above.changedProps.has("items")) {
    if (!deepCompare(below.items, above.items)) return "items"
  }

  for (const [prop] of above.changedProps) {
    if (!(prop in KnownProps)) return prop as UnhandledProp
  }

  return
}

function findConflictsInPlainEntity(
  above: FullEntity | ReferenceEntity,
  below: FullEntity,
): ConflictingProp | undefined {
  if (below.name !== above.name) return "name"

  if (!deepCompare(below.items, above.items)) return "items"

  for (const [prop, value] of pairs(above)) {
    if (!(prop in KnownProps || deepCompare(value, below[prop]))) {
      return prop as UnhandledProp
    }
  }
  for (const [prop] of pairs(below)) {
    if (!(prop in above || prop in KnownProps || deepCompare(below[prop], above[prop]))) {
      return prop as UnhandledProp
    }
  }

  return undefined
}

export function findEntityPasteConflictAndUpdate(
  below: FullEntity,
  above: UpdateablePasteEntity,
): ConflictingProp | undefined {
  if ((above as ReferenceEntity).changedProps) {
    return findConflictsAndUpdateReferenceEntity(below, above as ReferenceEntity)
  }
  return findConflictsInPlainEntity(above, below)
}
export const findEntityPasteConflict: (
  below: FullEntity,
  above: PlainEntity | ReferenceEntity,
) => ConflictingProp | undefined = findEntityPasteConflictAndUpdate

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

export function createReferenceOnlyEntity(entity: Entity): ReferenceEntity {
  const result = shallowCopy(entity) as Mutable<ReferenceEntity>
  result.changedProps = new LuaSet<UpdateableProp>()
  return result
}
