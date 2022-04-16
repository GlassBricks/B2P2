import { deepCompare, isEmpty, shallowCopy } from "../lib/util"
import { Mutable } from "../lib/util-types"
import {
  ConflictingProp,
  IgnoredProps,
  KnownProps,
  PlainEntity,
  ReferenceEntity,
  UnhandledProp,
  UpdateablePasteEntity,
  UpdateableProp,
  UpdateableReferenceEntity,
} from "./entity"

function findConflictsAndUpdateReferenceEntity(
  below: BlueprintEntityRead,
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
  above: BlueprintEntityRead | ReferenceEntity,
  below: BlueprintEntityRead,
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
  below: BlueprintEntityRead,
  above: UpdateablePasteEntity,
): ConflictingProp | undefined {
  if ((above as ReferenceEntity).changedProps) {
    return findConflictsAndUpdateReferenceEntity(below, above as ReferenceEntity)
  }
  return findConflictsInPlainEntity(above, below)
}
export const findEntityPasteConflict = (
  below: BlueprintEntityRead,
  above: BlueprintEntityRead | PlainEntity,
): ConflictingProp | undefined => findEntityPasteConflictAndUpdate(below, above as PlainEntity)

export function computeEntityDiff(
  before: BlueprintEntityRead,
  after: BlueprintEntityRead,
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

  if (isEmpty(changedProps)) return undefined

  const result = shallowCopy(after) as Mutable<ReferenceEntity>
  result.changedProps = changedProps
  return result
}

export function createReferenceOnlyEntity(entity: BlueprintEntityRead): ReferenceEntity {
  const result = shallowCopy(entity) as Mutable<ReferenceEntity>
  result.changedProps = new LuaSet<UpdateableProp>()
  return result
}
