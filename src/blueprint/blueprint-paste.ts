import {
  ConflictingProp,
  Entity,
  EntityNumber,
  FullEntity,
  PasteEntity,
  PlainEntity,
  ReferenceEntity,
} from "../entity/entity"
import { findEntityPasteConflictAndUpdate, isCompatibleEntity } from "../entity/entity-paste"
import { nilIfEmpty } from "../lib"
import { bbox, pos } from "../lib/geometry"
import { Blueprint, filterEntitiesInArea, UpdateablePasteBlueprint } from "./Blueprint"
import { pasteBlueprint } from "./world"

export function findCompatibleEntity<T extends Entity>(
  blueprint: Blueprint<T>,
  entity: Entity,
  position: MapPositionTable = entity.position,
): T | undefined {
  const entities = blueprint.getAt(position)
  if (entities === undefined) return undefined
  for (const [e] of entities) {
    if (isCompatibleEntity(e, entity, position)) return e
  }
  return undefined
}

export type Overlap = FullEntity

export interface PropConflict {
  readonly below: FullEntity
  readonly above: PasteEntity
  readonly prop: ConflictingProp
}

export interface BlueprintPasteConflicts {
  readonly overlaps?: Overlap[]
  readonly propConflicts?: PropConflict[]
  readonly lostReferences?: ReferenceEntity[]
}

export function pasteAndFindConflicts(
  surface: LuaSurface,
  worldArea: BoundingBoxRead,
  content: UpdateablePasteBlueprint,
  pasteLocation: MapPositionTable,
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

  const propConflicts: PropConflict[] = []
  const overlaps: Overlap[] = []
  const lostReferences: ReferenceEntity[] = []

  // process not pasted entities
  for (const bpEntity of filteredContent.entities) {
    if (pastedBPEntities.has(bpEntity.entity_number)) {
      // already pasted
      if (bpEntity.changedProps) {
        lostReferences.push(bpEntity)
      }
      continue
    }
    // try to find corresponding entity in world
    const worldPosition = pos.add(bpEntity.position, pasteLocation)
    const belowLuaEntity = surface
      .find_entities_filtered({ position: worldPosition })
      .find((x) => isCompatibleEntity(x, bpEntity, worldPosition))
    if (belowLuaEntity) {
      const belowBpEntity = toBPEntityMap.get(belowLuaEntity.unit_number!)
      if (!belowBpEntity) {
        // should not happen...
        error(`Could not find entity in blueprint: ${belowLuaEntity.name}`)
      }
      const conflict = findEntityPasteConflictAndUpdate(belowBpEntity, bpEntity)
      if (conflict !== undefined) {
        propConflicts.push({
          above: bpEntity,
          below: belowBpEntity,
          prop: conflict,
        })
      }
    } else {
      // must intersect something
      overlaps.push(bpEntity)
    }
  }
  const conflicts = {
    overlaps: nilIfEmpty(overlaps),
    propConflicts: nilIfEmpty(propConflicts),
    lostReferences: nilIfEmpty(lostReferences),
  }
  return $multi(conflicts, pastedEntities)
}
