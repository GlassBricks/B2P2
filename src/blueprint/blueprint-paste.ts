import { Entity, EntityNumber, PlainEntity } from "../entity/entity"
import { Blueprint, MutableBlueprint, MutablePasteBlueprint, PasteBlueprint } from "./Blueprint"
import { PasteEntity } from "../entity/reference-entity"
import { ConflictingProp } from "../entity/entity-props"
import { findCompatibleEntity, findOverlappingEntity } from "./blueprint-diff"
import { computeEntityDiff, findEntityPasteConflict } from "../entity/entity-paste"

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
}

export function findBlueprintPasteConflicts(below: Blueprint, above: PasteBlueprint): BlueprintPasteConflicts {
  const overlaps: Overlap[] = []
  const propConflicts: PropConflict[] = []
  for (const [, aboveEntity] of pairs(above.entities)) {
    const compatible = findCompatibleEntity(below, aboveEntity)
    if (compatible) {
      const conflict = findEntityPasteConflict(compatible, aboveEntity)
      if (conflict !== undefined) {
        propConflicts.push({
          below: compatible,
          above: aboveEntity,
          prop: conflict,
        })
      }

      continue
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
  return { overlaps, propConflicts }
}

export interface BlueprintDiff {
  readonly content: PasteBlueprint
  readonly deletions: PlainEntity[]
}

// complementary to findBlueprintPasteConflicts after this
export function computeBlueprintDiff(below: Blueprint, current: Blueprint): BlueprintDiff {
  const deletions: PlainEntity[] = []
  const content: MutablePasteBlueprint = new MutableBlueprint()

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
