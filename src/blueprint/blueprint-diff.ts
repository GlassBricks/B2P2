import { Entity } from "../entity/entity"
import { Blueprint } from "./Blueprint"
import { isCompatibleEntity } from "../entity/entity-diff"

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
