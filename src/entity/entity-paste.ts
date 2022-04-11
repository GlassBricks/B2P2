import { IgnoredOnPasteProp, PropUpdateBehavior, PropUpdateBehaviors, UnpasteableProp } from "./entity-props"
import { deepCompare } from "../lib/util"

// for compiler to assert that the only ignored on paste prop (as currently implemented) is "items"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: Record<IgnoredOnPasteProp, true> = { items: true }

// this will replace the above function eventually
export function findPasteConflict(
  below: BlueprintEntityRead,
  above: BlueprintEntityRead,
): UnpasteableProp | IgnoredOnPasteProp | undefined {
  for (const [prop, value] of pairs(above)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly && !deepCompare(below[prop], value)) {
      return prop as UnpasteableProp
    }
  }
  for (const [prop] of pairs(below)) {
    if (above[prop] !== undefined) continue // already handled above
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly) {
      // exists in below, but not above
      return prop as UnpasteableProp
    }
  }

  // hardcoded for now
  const belowItems = below.items
  if (!deepCompare(belowItems, above.items)) {
    return "items"
  }

  return undefined
}
