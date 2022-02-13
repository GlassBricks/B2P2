import { Mutable } from "../lib/util-types"
import { getTileBox } from "./entity-info"
import { shallowCopy } from "../lib/util"

// all types in this file should be immutable
// mutation can only be done on a guaranteed own copy

export interface BaseBlueprintEntity extends BlueprintEntityRead {
  readonly tileBox: BoundingBoxRead
  readonly entity_number: number
  // readonly recipe?: string
}

export interface BasicEntity extends BaseBlueprintEntity {
  readonly entityType?: undefined
}

export const UpdateableProps = {
  name: true,
  recipe: true,
  direction: true,
  items: true,
  control_behavior: true,
  // todo: circuit network
} as const

export type UpdateableEntityProp = keyof typeof UpdateableProps
export const PasteableProps: Partial<typeof UpdateableProps> = {
  recipe: true,
  control_behavior: true,
  // direction: false,
}
export interface UpdateEntity extends BaseBlueprintEntity {
  readonly entityType: "update"
  // an empty object is a valid, meaning this only references an entity
  readonly changedProps: LuaSet<UpdateableEntityProp>
}

export type AnyEntity = BasicEntity | UpdateEntity

export function createBasicEntity(
  entity: BlueprintEntityRead,
  entityNumber: number = entity.entity_number,
): BasicEntity {
  const existingTileBox = (entity as BaseBlueprintEntity).tileBox
  if (existingTileBox && entity.entity_number === entityNumber && (entity as BasicEntity).entityType === undefined) {
    return entity as BasicEntity
  }
  const result = shallowCopy(entity) as Mutable<BasicEntity>
  result.entityType = undefined
  result.entity_number = entityNumber
  if (!existingTileBox) {
    result.tileBox = getTileBox(result)
  }
  return result
}

export function createUpdateEntity(
  entity: BlueprintEntityRead,
  changedProps: LuaSet<UpdateableEntityProp>,
  entityNumber: number = entity.entity_number,
): UpdateEntity {
  const result = shallowCopy(entity) as Mutable<UpdateEntity>
  result.entityType = "update"
  result.changedProps = changedProps
  result.entity_number = entityNumber
  result.tileBox ??= getTileBox(result)
  return result
}

export function withEntityNumber<E extends AnyEntity>(entity: E, entityNumber: number): E {
  if (entity.entity_number === entityNumber) {
    return entity
  }
  return { ...entity, entityNumber }
}
