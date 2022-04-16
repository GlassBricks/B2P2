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
import { ReferenceEntity } from "./reference-entity"
import { Mutable } from "../lib/util-types"

// for compiler to assert that the only ignored on paste prop (as currently implemented) is "items"
declare function testAccept<T extends keyof any>(value: Record<T, true>): void
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compilerAssert() {
  testAccept<IgnoredOnPasteProp>({ items: true })
  testAccept<UnpasteableProp>({ name: true })
}

function findEntityPasteConflictInReference(
  below: BlueprintEntityRead,
  above: ReferenceEntity,
): ConflictingProp | undefined {
  let unhandledProp: UnhandledProp | undefined
  for (const [prop] of above.changedProps) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly && !deepCompare(below[prop], above[prop])) {
      return prop as UnpasteableProp
    }
    if (behavior === undefined && !deepCompare(below[prop], above[prop])) {
      unhandledProp = prop as UnhandledProp
    }
  }
  if (above.changedProps.has("items")) {
    if (!deepCompare(below.items, above.items)) {
      return "items"
    }
  }
  if (unhandledProp !== undefined) {
    return unhandledProp
  }
  return undefined
}
function findEntityConflictsInPlainEntities(above: BlueprintEntityRead | ReferenceEntity, below: BlueprintEntityRead) {
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
// this will replace the above function eventually
export function findEntityPasteConflict(
  below: BlueprintEntityRead,
  above: BlueprintEntityRead | ReferenceEntity,
): ConflictingProp | undefined {
  if ((above as ReferenceEntity).diffType === "reference") {
    return findEntityPasteConflictInReference(below, above as ReferenceEntity)
  }
  return findEntityConflictsInPlainEntities(above, below)
}

export function computeEntityDiff(
  before: BlueprintEntityRead,
  after: BlueprintEntityRead,
): ReferenceEntity | undefined {
  const changedProps = new LuaSet<UpdateableProp>()
  for (const [prop, value] of pairs(after)) {
    if (PropUpdateBehaviors[prop] !== PropUpdateBehavior.Unchecked && !deepCompare(before[prop], value)) {
      changedProps.add(prop as UpdateableProp)
    }
  }
  for (const [prop] of pairs(before)) {
    if (after[prop] !== undefined) continue // already handled above
    if (PropUpdateBehaviors[prop] !== PropUpdateBehavior.Unchecked) {
      changedProps.add(prop as UpdateableProp)
    }
  }

  if (isEmpty(changedProps)) return undefined

  const result = shallowCopy(after) as Mutable<ReferenceEntity>
  result.diffType = "reference"
  result.changedProps = changedProps
  return result
}

export function createReferenceOnlyEntity(entity: BlueprintEntity): ReferenceEntity {
  const result = shallowCopy(entity) as Mutable<ReferenceEntity>
  result.diffType = "reference"
  result.changedProps = new LuaSet<UpdateableProp>()
  return result
}
