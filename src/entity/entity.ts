import { getTileArea } from "./entity-info"
import { mutableShallowCopy } from "../lib/util"

export type EntityNumber = number & { _bpEntityNumberBrand: never }

export interface Entity {
  readonly number: EntityNumber
  readonly tileBox: BoundingBoxRead
  readonly entity: BlueprintEntity
}

export function createEntity(
  bpEntity: BlueprintEntityRead,
  number: EntityNumber = bpEntity.entity_number as EntityNumber,
): Entity {
  return {
    number,
    tileBox: getTileArea(bpEntity),
    entity: bpEntity,
  }
}

export function withEntityNumber(entity: Entity, number: EntityNumber): Entity {
  if (entity.number === number) return entity
  const copy = mutableShallowCopy(entity)
  copy.number = number
  return copy
}
