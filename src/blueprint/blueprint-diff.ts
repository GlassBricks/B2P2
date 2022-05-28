import { EntityNumber, FullEntity, PasteEntity, PlainEntity } from "../entity/entity"
import { computeEntityDiff, createReferenceOnlyEntity } from "../entity/entity-paste"
import { nilIfEmpty } from "../lib"
import { Blueprint } from "./Blueprint"
import { findCompatibleEntity } from "./blueprint-paste"
import { LuaBlueprint, PasteBlueprint } from "./LuaBlueprint"

export interface BlueprintDiff {
  readonly content: PasteBlueprint
  readonly deletions?: PlainEntity[]
}
export function computeBlueprintDiff(below: Blueprint<FullEntity>, current: Blueprint<FullEntity>): BlueprintDiff {
  const corresponding = new LuaMap<FullEntity, FullEntity | undefined>() // new to old
  const entityNumberMap: Record<EntityNumber, EntityNumber> = {} // old to new
  const shouldAlwaysInclude = new LuaSet<number>()

  const [, belowMap] = below.getEntitiesAndPositionMap()
  // find corresponding entities
  const currentEntities = current.getEntities()
  for (const entity of currentEntities) {
    const compatible = findCompatibleEntity(belowMap, entity)
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
  for (const currentEntity of currentEntities) {
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
  for (const belowEntity of below.getEntities()) {
    if (!(belowEntity.entity_number in entityNumberMap)) {
      deletions.push(belowEntity)
    }
  }

  return {
    content: LuaBlueprint.fromArray(content),
    deletions: nilIfEmpty(deletions),
  }
}
