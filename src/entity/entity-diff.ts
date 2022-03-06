import { compare, isEmpty } from "../lib/util"
import { getEntityInfo } from "./entity-info"
import * as util from "util"
import {
  AnyEntity,
  BasicEntity,
  createUpdateEntity,
  UpdateableEntityProp,
  UpdateableProps,
  UpdateEntity,
} from "./Entity"
import { pos } from "../lib/geometry/position"
import { UP } from "../lib/geometry/rotation"
import { BasicBlueprint } from "./EntityGrid"
import { bbox } from "../lib/geometry/bounding-box"

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
export function compareEntities(old: BasicEntity, cur: BasicEntity): UpdateEntity | "incompatible" | undefined {
  if (!isCompatibleEntity(old, cur)) return "incompatible"
  return compareCompatibleEntities(old, cur)
}

/** This assumes the entities are compatible. */
export function compareCompatibleEntities(old: AnyEntity, cur: AnyEntity): UpdateEntity | undefined {
  // assume compatible
  const changedProps = new LuaSet<UpdateableEntityProp>()
  for (const [prop] of pairs(UpdateableProps)) {
    if (!compare(old[prop], cur[prop])) {
      changedProps.add(prop)
    }
  }
  if (isEmpty(changedProps)) return undefined
  return createUpdateEntity(cur, changedProps)
}

/**
 * Tries to find an entity in the blueprint that is compatible with the given entity.
 *
 * Returns the string "overlap" if there is no compatible entity but another entity overlaps. Returns undefined if there
 * is no compatible entity and no other entity overlaps.
 */
export function findCompatibleOrOverlappingEntity(
  blueprint: BasicBlueprint,
  entity: BasicEntity,
): BasicEntity | "overlap" | undefined {
  const matchCandidates = blueprint.getAt(entity.position)
  if (matchCandidates) {
    for (const [candidate] of matchCandidates) {
      if (isCompatibleEntity(candidate, entity)) {
        return candidate
      }
    }
    return "overlap"
  }
  // search for overlaps
  const box = entity.tileBox
  for (const [x, y] of bbox.iterateTiles(box)) {
    const entities = blueprint.getAt(pos(x, y))
    if (entities && !isEmpty(entities)) {
      return "overlap"
    }
  }
  return undefined
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
