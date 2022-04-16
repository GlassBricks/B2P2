import {
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: Record<IgnoredOnPasteProp, true> = { items: true }

// this will replace the above function eventually
export function findEntityPasteConflict(
  below: BlueprintEntityRead,
  above: BlueprintEntityRead,
): UnpasteableProp | IgnoredOnPasteProp | UnhandledProp | undefined {
  let unhandledProp: keyof BlueprintEntityRead | undefined

  for (const [prop, value] of pairs(above)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly && !deepCompare(below[prop], value)) {
      return prop as UnpasteableProp
    }
    if (behavior === undefined && !deepCompare(below[prop], value)) {
      unhandledProp = prop
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
      unhandledProp = prop
    }
  }

  // hardcoded for now
  const belowItems = below.items
  if (!deepCompare(belowItems, above.items)) {
    return "items"
  }

  if (unhandledProp !== undefined) {
    return unhandledProp as UnhandledProp
  }

  return undefined
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
