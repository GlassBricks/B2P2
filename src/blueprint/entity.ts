import { getTileArea } from "./entity-info"

export type EntityId = number & { _bpEntityIdBrand: never }

export interface Entity extends BlueprintEntityRead {
  readonly entity_number: EntityId
  readonly tileBox: BoundingBoxRead
}
export function entityFrom(original: BlueprintEntityRead, entity_number: EntityId): Entity {
  return {
    ...original,
    entity_number,
    tileBox: getTileArea(original),
  }
}
