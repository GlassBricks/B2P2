import { Mutable } from "../lib/util-types"
import { getTileBox } from "./entity-info"
import { shallowCopy } from "../lib/util"
import { L_Bbpp } from "../locale"

// all types in this file should be immutable
// mutation can only be done on a guaranteed own copy

export interface BaseEntity extends BlueprintEntityRead {
  readonly tileBox: BoundingBoxRead
  readonly entity_number: number

  readonly diffType?: string
  readonly sourceName?: string
}

export interface BasicEntity extends BaseEntity {
  readonly diffType?: undefined
}

export interface DeleteEntity extends BaseEntity {
  readonly diffType: "delete"
}

export type UpdateableProp = "name" | "recipe" | "direction" | "items" | "control_behavior" | "override_stack_size"
export const UpdateableProp: ReadonlyLuaSet<UpdateableProp> = {
  name: true,
  recipe: true,
  direction: true,
  items: true,
  control_behavior: true,
  override_stack_size: true,
  // todo: circuit network
  // todo: detect unhandled properties
} as unknown as LuaSet<UpdateableProp>

export interface UpdateEntity extends BaseEntity {
  readonly diffType: "update"
  // an empty object is a valid, meaning this only references an entity
  readonly changedProps: ReadonlyLuaSet<UpdateableProp>
}

export type AnyEntity = BasicEntity | UpdateEntity | DeleteEntity

export function createBasicEntity(
  entity: BlueprintEntityRead,
  entityNumber: number = entity.entity_number,
): BasicEntity {
  const existingTileBox = (entity as BaseEntity).tileBox
  if (existingTileBox && entity.entity_number === entityNumber && (entity as BasicEntity).diffType === undefined) {
    return entity as BasicEntity
  }
  const result = shallowCopy(entity) as Mutable<BasicEntity>
  result.diffType = undefined
  result.entity_number = entityNumber
  if (!existingTileBox) {
    result.tileBox = getTileBox(result)
  }
  return result
}

export function createDeleteEntity(
  entity: BlueprintEntityRead,
  entityNumber: number = entity.entity_number,
): DeleteEntity {
  const existingTileBox = (entity as BaseEntity).tileBox
  if (existingTileBox && entity.entity_number === entityNumber && (entity as DeleteEntity).diffType === "delete") {
    return entity as DeleteEntity
  }
  const result = shallowCopy(entity) as Mutable<DeleteEntity>
  result.diffType = "delete"
  result.entity_number = entityNumber
  if (!existingTileBox) {
    result.tileBox = getTileBox(result)
  }
  return result
}

export function createUpdateEntity(
  entity: BlueprintEntityRead,
  changedProps: LuaSet<UpdateableProp>,
  entityNumber: number = entity.entity_number,
): UpdateEntity {
  const result = shallowCopy(entity) as Mutable<UpdateEntity>
  result.diffType = "update"
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

export function describeEntity(
  entity: BaseEntity,
  sourceName: string | undefined = entity.sourceName,
): LocalisedString {
  if (sourceName) {
    return [L_Bbpp.EntityFromLayer, ["entity-name." + entity.name], entity.sourceName]
  }
  return ["entity-name." + entity.name]
}
