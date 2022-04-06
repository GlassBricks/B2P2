import { getTileArea } from "./entity-info"
import { mutableShallowCopy } from "../lib/util"

/** This corresponds to entity_number only when converted back to native entities. */
export type EntityId = number & { _bpEntityIdBrand: never }

export interface Entity {
  readonly id: EntityId
  readonly tileBox: BoundingBoxRead
  readonly entity: BlueprintEntityRead
}

export function createEntity(bpEntity: BlueprintEntityRead, id: EntityId = bpEntity.entity_number as EntityId): Entity {
  return {
    id,
    tileBox: getTileArea(bpEntity),
    entity: bpEntity,
  }
}

export function withEntityId<T extends Entity>(entity: T, id: EntityId): T {
  if (entity.id === id) return entity
  const result = mutableShallowCopy(entity)
  result.id = id
  return result
}
