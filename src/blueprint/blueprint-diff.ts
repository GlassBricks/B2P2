import { Entity } from "../entity/entity"
import { Blueprint } from "./Blueprint"
import { isCompatibleEntity } from "../entity/entity-diff"
import { bbox } from "../lib/geometry/bounding-box"

export function findCompatibleEntity<T extends Entity>(
  blueprint: Blueprint<T>,
  entity: BlueprintEntityRead,
): T | undefined {
  const entities = blueprint.getAt(entity.position)
  if (entities === undefined) return undefined
  for (const [e] of entities) {
    if (isCompatibleEntity(e, entity)) return e
  }
  return undefined
}

// may report compatible entities as overlapping
export function findOverlappingEntity<T extends Entity>(blueprint: Blueprint<T>, entity: Entity): T | undefined {
  for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
    const entities = blueprint.getAtPos(x, y)
    if (entities !== undefined) {
      const entity = entities.first()
      if (entity !== undefined) return entity
    }
  }
  return undefined
}
