import { compare, isEmpty, shallowCopy } from "../lib/util"
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
import { Blueprint } from "./Blueprint"
import { bbox } from "../lib/geometry/bounding-box"
import { Mutable } from "../lib/util-types"

const oppositedirection = util.oppositedirection
/** Compatible entities are those that are considered to be the "same" entity, considered the same when pasting. */
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

export function findCompatibleOrOverlappingEntity<E extends AnyEntity>(
  blueprint: Blueprint<E>,
  entity: AnyEntity,
):
  | {
      type: "compatible" | "overlapping"
      entity: E
    }
  | {
      type?: undefined
      entity?: never
    } {
  const matchCandidates = blueprint.getAt(entity.position)
  if (matchCandidates) {
    for (const [candidate] of matchCandidates) {
      if (isCompatibleEntity(candidate, entity)) {
        return {
          type: "compatible",
          entity: candidate,
        }
      }
    }
    return {
      type: "overlapping",
      entity: next(matchCandidates)[0],
    }
  }
  // search for overlaps elsewhere
  const box = entity.tileBox
  for (const [x, y] of bbox.iterateTiles(box)) {
    const entities = blueprint.getAt(pos(x, y))
    if (entities && !isEmpty(entities)) {
      return {
        type: "overlapping",
        entity: next(entities)[0],
      }
    }
  }
  return {}
}

export function findCompatibleEntity<E extends AnyEntity>(blueprint: Blueprint<E>, entity: AnyEntity): E | undefined {
  const matchCandidates = blueprint.getAt(entity.position)
  if (matchCandidates) {
    for (const [candidate] of matchCandidates) {
      if (isCompatibleEntity(candidate, entity)) {
        return candidate
      }
    }
  }
  return undefined
}

export interface EntityPasteResult {
  entity: BasicEntity
  incompatibleProps: UpdateableEntityProp[]
}

// assumes entities are compatible
export function pasteEntityUpdate(entity: BasicEntity, update: BasicEntity | UpdateEntity): EntityPasteResult {
  const incompatibleProps: UpdateableEntityProp[] = []
  const result = shallowCopy(entity) as Record<UpdateableEntityProp, any>
  const changedProps =
    update.diffType === undefined ? (UpdateableProps as unknown as LuaSet<UpdateableEntityProp>) : update.changedProps
  const entityInfo = getEntityInfo(entity.name)
  for (const [prop] of changedProps) {
    if (entityInfo.isPropPasteable(prop)) {
      result[prop] = update[prop]
    } else {
      const oldProp = entity[prop]
      const newProp = update[prop]
      if (!compare(oldProp, newProp)) {
        incompatibleProps.push(prop)
      }
    }
  }

  return {
    entity: result as BasicEntity,
    incompatibleProps,
  }
}

export function asBasicEntity(entity: UpdateEntity | BasicEntity): BasicEntity {
  if (entity.diffType === undefined) {
    return entity
  }
  const result = shallowCopy(entity) as Mutable<Partial<UpdateEntity>>
  delete result.changedProps
  delete result.diffType
  return result as BasicEntity
}
