import { Entity, EntityNumber, PasteEntity, PlainEntity, ReferenceEntity } from "../entity/entity"
import {
  Blueprint,
  getBlueprintFromWorld,
  MutableBlueprint,
  PasteBlueprint,
  UpdateablePasteBlueprint,
} from "./Blueprint"
import { ConflictingProp } from "../entity/entity-props"
import { findCompatibleEntity, findOverlappingEntity } from "./blueprint-diff"
import { computeEntityDiff, findEntityPasteConflictAndUpdate } from "../entity/entity-paste"

export interface Overlap {
  readonly below: Entity
  readonly above: PasteEntity
}

export interface PropConflict {
  readonly below: Entity
  readonly above: PasteEntity
  readonly prop: ConflictingProp
}

export interface BlueprintPasteConflicts {
  readonly overlaps: Overlap[]
  readonly propConflicts: PropConflict[]
  readonly lostReferences: ReferenceEntity[]
}

export function findBlueprintPasteConflictAndUpdate(
  below: Blueprint,
  above: UpdateablePasteBlueprint,
): BlueprintPasteConflicts {
  const overlaps: Overlap[] = []
  const propConflicts: PropConflict[] = []
  const lostReferences: ReferenceEntity[] = []
  for (const [, aboveEntity] of pairs(above.entities)) {
    const compatible = findCompatibleEntity(below, aboveEntity)
    if (compatible) {
      const conflict = findEntityPasteConflictAndUpdate(compatible, aboveEntity)
      if (conflict !== undefined) {
        propConflicts.push({
          below: compatible,
          above: aboveEntity,
          prop: conflict,
        })
      }

      continue
    }

    if (aboveEntity.changedProps) {
      lostReferences.push(aboveEntity)
      // fall through to treating like a normal entity
    }

    const overlapping = findOverlappingEntity(below, aboveEntity)
    if (overlapping) {
      overlaps.push({
        below: overlapping,
        above: aboveEntity,
      })
    }
  }

  // stub
  return { overlaps, propConflicts, lostReferences }
}

export const findBlueprintPasteConflicts = (below: Blueprint, above: Blueprint): BlueprintPasteConflicts =>
  findBlueprintPasteConflictAndUpdate(below, above)

export function findBlueprintPasteContentsInWorldAndUpdate(
  surface: SurfaceIdentification,
  area: BoundingBoxRead,
  content: UpdateablePasteBlueprint,
  location: MapPositionTable,
): BlueprintPasteConflicts {
  const contentArea = content.computeBoundingBox().shift(location).intersect(area)
  const below = getBlueprintFromWorld(surface, contentArea, location)
  return findBlueprintPasteConflictAndUpdate(below, content)
}

export interface BlueprintDiff {
  readonly content: PasteBlueprint
  readonly deletions: PlainEntity[]
}

// complementary to findBlueprintPasteConflicts after this
// todo: create reference entities for connections/neighbours
// todo: replace "Blueprint" entities?
export function computeBlueprintDiff(below: Blueprint, current: Blueprint): BlueprintDiff {
  const deletions: PlainEntity[] = []
  const content = new MutableBlueprint<PasteEntity>()

  const belowAccountedFor = new LuaSet<EntityNumber>()
  for (const [, currentEntity] of pairs(current.entities)) {
    const compatible = findCompatibleEntity(below, currentEntity)
    if (compatible) {
      const referenceEntity = computeEntityDiff(compatible, currentEntity)
      if (referenceEntity !== undefined) {
        content.addSingle(referenceEntity)
      }

      belowAccountedFor.add(compatible.entity_number)
    } else {
      content.addSingle(currentEntity)
    }
  }
  for (const [number, belowEntity] of pairs(below.entities)) {
    if (!belowAccountedFor.has(number)) {
      deletions.push(belowEntity)
    }
  }

  return {
    content,
    deletions,
  }
}
