import { EntityNumber, FullEntity, PasteEntity, PlainEntity } from "../entity/entity"
import { computeEntityDiff, createReferenceOnlyEntity } from "../entity/entity-paste"
import { nilIfEmpty } from "../lib/util"
import { Blueprint, PasteBlueprint } from "./Blueprint"
import { findCompatibleEntity } from "./blueprint-paste"

export interface BlueprintDiff {
  readonly content: PasteBlueprint
  readonly deletions?: PlainEntity[]
}
export function computeBlueprintDiff(below: Blueprint, current: Blueprint): BlueprintDiff {
  const corresponding = new LuaMap<FullEntity, FullEntity | undefined>() // new to old
  const entityNumberMap: Record<EntityNumber, EntityNumber> = {} // old to new
  const shouldAlwaysInclude = new LuaSet<number>()

  // find corresponding entities
  for (const entity of current.entities) {
    const compatible = findCompatibleEntity(below, entity)
    if (compatible) {
      // new entity
      corresponding.set(entity, compatible)
      entityNumberMap[compatible.entity_number] = entity.entity_number
    } else {
      // existing entity, mark all circuit neighbours to shouldAlwaysInclude
      const connections = entity.connections
      if (connections) {
        markConnectionPoint(connections["1"])
        markConnectionPoint(connections["2"])
      }
    }
  }

  // marking connection neighbors of new entity to shouldAlwaysInclude
  function markConnectionPoint(point: BlueprintConnectionPoint | undefined) {
    if (point) {
      markConnectionData(point.red)
      markConnectionData(point.green)
    }
  }
  function markConnectionData(point: BlueprintConnectionData[] | undefined) {
    if (point) {
      for (const data of point) {
        shouldAlwaysInclude.add(data.entity_id)
      }
    }
  }

  const content: PasteEntity[] = []
  for (const currentEntity of current.entities) {
    const compatible = corresponding.get(currentEntity)
    if (compatible) {
      const referenceEntity = computeEntityDiff(compatible, currentEntity, entityNumberMap)
      if (referenceEntity) {
        content.push(referenceEntity)
      } else if (shouldAlwaysInclude.has(currentEntity.entity_number)) {
        content.push(createReferenceOnlyEntity(currentEntity))
      }
    } else {
      content.push(currentEntity)
    }
  }

  const deletions: PlainEntity[] = []
  for (const belowEntity of below.entities) {
    if (!(belowEntity.entity_number in entityNumberMap)) {
      deletions.push(belowEntity)
    }
  }

  return {
    content: Blueprint.fromArray(content),
    deletions: nilIfEmpty(deletions),
  }
}
