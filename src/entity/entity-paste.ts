import { IgnoredOnPasteProp, NotPasteableProp, PropUpdateBehavior, PropUpdateBehaviors } from "./entity-props"
import { deepCompare } from "../lib/util"
import { PRecord } from "../lib/util-types"

export interface SuccessfulPasteResult {
  entity: BlueprintEntityRead
  ignoredProps?: IgnoredOnPasteProp[]
}
export interface FailedPasteResult {
  conflictingProp: NotPasteableProp
}

// only for compiler to assert that the only ignored on paste prop so far is "items"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: Record<IgnoredOnPasteProp, true> = { items: true }

export function tryPasteCompatibleEntities(
  below: BlueprintEntityRead,
  above: BlueprintEntityRead,
): LuaMultiReturn<[true, SuccessfulPasteResult] | [false, FailedPasteResult]> {
  const result: PRecord<keyof BlueprintEntityRead, unknown> = {}
  for (const [prop, value] of pairs(above)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.UpdateableOnly) {
      if (!deepCompare(below[prop], value)) {
        return $multi(false, { conflictingProp: prop as NotPasteableProp })
      }
      result[prop] = value
    } else if (behavior === PropUpdateBehavior.Pasteable) {
      result[prop] = value
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: PropUpdateBehavior.Irrelevant | PropUpdateBehavior.IgnoredOnPaste | undefined = behavior
      // do nothing
    }
  }

  for (const [prop, value] of pairs(below)) {
    const behavior = PropUpdateBehaviors[prop]
    if (behavior === PropUpdateBehavior.Irrelevant) {
      result[prop] = value
    }

    if (above[prop] !== undefined) continue // already handled above
    if (behavior === PropUpdateBehavior.UpdateableOnly) {
      // exists in below, but not above
      return $multi(false, { conflictingProp: prop as NotPasteableProp })
    }
    if (behavior === PropUpdateBehavior.Pasteable) {
      result[prop] = undefined
    }
  }

  const belowItems = below.items
  if (!deepCompare(belowItems, above.items)) {
    result.items = belowItems
    return $multi(true, { entity: result as BlueprintEntityRead, ignoredProps: ["items"] })
  }
  return $multi(true, { entity: result as BlueprintEntityRead })
}
