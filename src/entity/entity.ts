import { mutableShallowCopy, shallowCopy } from "../lib/util"
import { Mutable } from "../lib/util-types"
import { getTileBox } from "./entity-info"

/** This corresponds to entity_number only when converted back to native entities. */
export type EntityNumber = number & { _bpEntityIdBrand: never }

export interface Entity extends BlueprintEntityRead {
  readonly entity_number: EntityNumber
  readonly tileBox: BoundingBoxRead
}
export interface PlainEntity extends Entity {
  readonly diffType?: never
}

export function createEntity(entity: BlueprintEntityRead, number?: EntityNumber): Entity {
  const result = shallowCopy(entity) as Mutable<Entity>
  if (number !== undefined) result.entity_number = number
  result.tileBox ??= getTileBox(result)
  return result
}

export function makeIntoEntity(this: unknown, entity: Mutable<BlueprintEntityRead>): asserts entity is Entity {
  ;(entity as Mutable<Entity>).tileBox ??= getTileBox(entity)
}

export function withEntityNumber<T extends Entity>(entity: T, number: EntityNumber): T {
  if (entity.entity_number === number) return entity
  const result = mutableShallowCopy(entity)
  result.entity_number = number
  return result
}
