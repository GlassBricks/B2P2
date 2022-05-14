import { Entity, EntityNumber, FullEntity, PasteEntity, PlainEntity, ReferenceEntity } from "../entity/entity"
import { findEntityPasteConflictAndUpdate, isCompatibleEntity } from "../entity/entity-paste"
import { nilIfEmpty } from "../lib"
import { BBox, bbox, pos, Position } from "../lib/geometry"
import { Blueprint, filterEntitiesInArea, UpdateablePasteBlueprint } from "./Blueprint"
import { pasteBlueprint } from "./world"

export function findCompatibleEntity<T extends Entity>(
  blueprint: Blueprint<T>,
  entity: Entity,
  position: Position = entity.position,
): T | undefined {
  const entities = blueprint.getAt(position)
  if (entities === undefined) return undefined
  for (const [e] of entities) {
    if (isCompatibleEntity(e, entity, position)) return e
  }
  return undefined
}

export type Overlap = FullEntity

export interface EntityPair {
  readonly below: FullEntity
  readonly above: PasteEntity
}

export interface BlueprintPasteConflicts {
  readonly overlaps?: Overlap[]
  readonly upgrades?: EntityPair[]
  readonly itemRequestChanges?: EntityPair[]
  readonly lostReferences?: ReferenceEntity[]
}

export function pasteAndFindConflicts(
  surface: LuaSurface,
  worldArea: BBox,
  content: UpdateablePasteBlueprint,
  pasteLocation: Position,
): LuaMultiReturn<[BlueprintPasteConflicts, LuaEntity[]]> {
  const relativeArea = bbox.shiftNegative(worldArea, pasteLocation)
  const filteredContent = Blueprint._new(filterEntitiesInArea(content.entities, relativeArea))

  const actualCoveredArea = bbox.shift(filteredContent.computeBoundingBox(), pasteLocation)
  const [belowContent, belowIndex] = Blueprint.takeWithSourceIndex(surface, actualCoveredArea, pasteLocation)

  const pastedEntities = pasteBlueprint(surface, pasteLocation, filteredContent.entities)

  // find pasted blueprint entities
  const pastedBPEntities = new LuaSet<EntityNumber>()
  for (const pastedEntity of pastedEntities) {
    const relativeLocation = pos.sub(pastedEntity.position, pasteLocation)
    const corresponding = findCompatibleEntity(filteredContent, pastedEntity, relativeLocation)
    if (corresponding === undefined) {
      error("bp entity corresponding to pasted lua entity not found")
    }
    pastedBPEntities.add(corresponding.entity_number)
  }

  // build luaEntity -> blueprint entity map
  const toBPEntityMap = new LuaMap<UnitNumber, PlainEntity>()
  for (const [entityNumber, luaEntity] of pairs(belowIndex)) {
    toBPEntityMap.set(luaEntity.unit_number!, belowContent.entities[entityNumber - 1])
  }

  // find conflicts

  const overlaps: Overlap[] = []
  const upgrades: EntityPair[] = []
  const itemRequestChanges: EntityPair[] = []
  const lostReferences: ReferenceEntity[] = []

  for (const aboveBpEntity of filteredContent.entities) {
    if (pastedBPEntities.has(aboveBpEntity.entity_number)) {
      // already pasted
      if (aboveBpEntity.changedProps) {
        lostReferences.push(aboveBpEntity)
      }
      continue
    }
    // not pasted
    // try to find corresponding entity in world
    const worldPosition = pos.add(aboveBpEntity.position, pasteLocation)
    const belowLuaEntity = surface
      .find_entities_filtered({ position: worldPosition })
      .find((x) => isCompatibleEntity(x, aboveBpEntity, worldPosition))
    if (belowLuaEntity) {
      const belowBpEntity = toBPEntityMap.get(belowLuaEntity.unit_number!)
      if (!belowBpEntity) {
        // should not happen
        error(`Could not find entity in blueprint: ${belowLuaEntity.name}`)
      }
      const conflict = findEntityPasteConflictAndUpdate(belowBpEntity, aboveBpEntity)
      if (conflict === "name") {
        upgrades.push({ below: belowBpEntity, above: aboveBpEntity })
      } else if (conflict === "items") {
        itemRequestChanges.push({ below: belowBpEntity, above: aboveBpEntity })
      }
    } else {
      // must intersect something
      overlaps.push(aboveBpEntity)
    }
  }

  const conflicts: BlueprintPasteConflicts = {
    overlaps: nilIfEmpty(overlaps),
    upgrades: nilIfEmpty(upgrades),
    itemRequestChanges: nilIfEmpty(itemRequestChanges),
    lostReferences: nilIfEmpty(lostReferences),
  }
  return $multi(conflicts, pastedEntities)
}
