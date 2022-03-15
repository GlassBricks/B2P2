import { BasicBlueprint, BlueprintDiff, MutableBlueprintDiff } from "./Blueprint"
import { compareCompatibleEntities, findCompatibleOrOverlappingEntity } from "./entity-diff"
import { createDeleteEntity } from "./Entity"

export function compareBlueprints(old: BasicBlueprint, cur: BasicBlueprint): BlueprintDiff {
  const diff = new MutableBlueprintDiff()
  const present: Record<number, true> = {}

  // find added or updated entities
  for (const [, entity] of pairs(cur.entities)) {
    const existing = findCompatibleOrOverlappingEntity(old, entity)
    if (existing.type !== "compatible") {
      // entity is new
      diff.add(entity)
    } else {
      const { entity: existingEntity } = existing
      present[existingEntity.entity_number] = true
      const update = compareCompatibleEntities(existingEntity, entity)
      if (update) {
        // entity is updated
        diff.add(update)
      }
    }
  }
  // find removed entities
  for (const [number, entity] of pairs(old.entities)) {
    if (!present[number]) {
      diff.add(createDeleteEntity(entity))
    }
  }
  return diff
}
