import {
  ConflictingProp,
  IgnoredOnPasteProp,
  PropUpdateBehavior,
  PropUpdateBehaviors,
  UnhandledProp,
  UnpasteableProp,
  UpdateableProp,
} from "./entity-props"
import { deepCompare, isEmpty, shallowCopy } from "../lib/util"
import { Mutable } from "../lib/util-types"
import { PlainEntity, ReferenceEntity, UpdateablePasteEntity, UpdateableReferenceEntity } from "./entity"

// for compiler to assert that the only ignored on paste prop (as currently implemented) is "items"
declare function testAccept<T extends keyof any>(value: Record<T, true>): void
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compilerAssert() {
  testAccept<IgnoredOnPasteProp>({ items: true })
  testAccept<UnpasteableProp>({ name: true })
}

function findConflictsAndUpdateReferenceEntity(
  below: BlueprintEntityRead,
  above: UpdateableReferenceEntity,
): ConflictingProp | undefined {
  const { changedProps } = above
  for (const [prop, value] of pairs(below)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior !== PropUpdateBehavior.Ignored && !changedProps.has(prop)) {
      above[prop] = value as never
    }
  }
  for (const [prop] of pairs(above)) {
    if (prop in below) continue
    const behavior = PropUpdateBehaviors[prop]
    if (behavior !== PropUpdateBehavior.Ignored && !changedProps.has(prop)) above[prop] = undefined!
  }

  if (above.changedProps.has("name")) {
    if (below.name !== above.name) return "name"
  }
  if (above.changedProps.has("items")) {
    if (!deepCompare(below.items, above.items)) {
      return "items"
    }
  }
  for (const [prop] of above.changedProps) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === undefined && !deepCompare(below[prop], above[prop])) {
      return prop as UnhandledProp
    }
  }
  return
}
function findConflictsInPlainEntity(above: BlueprintEntityRead | ReferenceEntity, below: BlueprintEntityRead) {
  let unhandledProp: UnhandledProp | undefined

  for (const [prop, value] of pairs(above)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly && !deepCompare(below[prop], value)) {
      return prop as UnpasteableProp
    }
    if (behavior === undefined && !deepCompare(below[prop], value)) {
      unhandledProp = prop as UnhandledProp
    }
  }
  for (const [prop] of pairs(below)) {
    if (above[prop] !== undefined) continue // already handled above
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly) {
      // exists in below, but not above
      return prop as UnpasteableProp
    }
    if (behavior === undefined) {
      unhandledProp = prop as UnhandledProp
    }
  }

  // hardcoded for now
  if (!deepCompare(below.items, above.items)) {
    return "items"
  }

  if (unhandledProp !== undefined) {
    return unhandledProp
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
    if (PropUpdateBehaviors[prop] !== PropUpdateBehavior.Ignored && !deepCompare(before[prop], value)) {
      changedProps.add(prop as UpdateableProp)
    }
  }
  for (const [prop] of pairs(before)) {
    if (after[prop] !== undefined) continue // already handled above
    if (PropUpdateBehaviors[prop] !== PropUpdateBehavior.Ignored) {
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
