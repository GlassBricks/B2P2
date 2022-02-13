import { compare, isEmpty } from "../lib/util"
import { getEntityInfo } from "./entity-info"
import * as util from "util"
import { AnyEntity, createUpdateEntity, UpdateableEntityProp, UpdateableProps, UpdateEntity } from "./Entity"
import { pos } from "../lib/geometry/position"
import { UP } from "../lib/geometry/rotation"

const oppositedirection = util.oppositedirection
export function isCompatibleEntity(old: AnyEntity, cur: AnyEntity): boolean {
  if (!pos.equals(old.position, cur.position)) return false

  const aInfo = getEntityInfo(old.name)
  const bInfo = getEntityInfo(cur.name)
  if (aInfo.fastReplaceGroup !== bInfo.fastReplaceGroup) return false
  if (!aInfo.fastReplaceGroup) {
    if (old.name !== cur.name) return false
  }

  if (old.direction !== cur.direction) {
    const flipped = oppositedirection(old.direction ?? UP) === (cur.direction ?? UP)
    if (flipped) {
      if (!aInfo.flippable) return false
    } else if (!aInfo.rotatable) {
      return false
    }
  }
  return true
}

/**
 * Compares two entities.
 *
 * @returns The string "incompatible" if they are not compatible, undefined if there are no changes, {@link UpdateEntity}
 *   if there are changes
 */
export function compareEntities(old: AnyEntity, cur: AnyEntity): UpdateEntity | "incompatible" | undefined {
  if (!isCompatibleEntity(old, cur)) return "incompatible"

  const changedProps = new LuaSet<UpdateableEntityProp>()
  for (const [prop] of pairs(UpdateableProps)) {
    if (!compare(old[prop], cur[prop])) {
      changedProps.add(prop)
    }
  }
  if (isEmpty(changedProps)) return undefined

  return createUpdateEntity(cur, changedProps)
}
//
// export interface EntityPasteResult {
//   entity: AssemblyEntity
//   incompatibleProps: UpdateableEntityProp[]
// }
// /** Result is safe to use in {@link AssemblyBuilder.replaceUnsafe} */
// export function pasteEntityUpdate(entity: AssemblyEntity, update: EntityUpdate): EntityPasteResult {
//   const { changedProps, newEntity } = update
//   const incompatibleProps: UpdateableEntityProp[] = []
//   const result = shallowCopy(entity) as Record<UpdateableEntityProp, any>
//   for (const [prop] of pairs(changedProps)) {
//     const pasteable = prop === "direction" ? getEntityInfo(entity.name).canPasteRotation : PasteableProps[prop]
//     if (pasteable) {
//       result[prop] = newEntity[prop]
//     } else {
//       incompatibleProps.push(prop)
//     }
//   }
//
//   return {
//     entity: result as AssemblyEntity,
//     incompatibleProps,
//   }
// }
