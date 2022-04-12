import { Entity } from "../entity/entity"
import { Blueprint } from "./Blueprint"
import { PasteBlueprint, PasteEntity } from "./paste-entity"
import { ConflictingProp } from "../entity/entity-props"
import { findCompatibleEntity, findOverlappingEntity } from "./blueprint-diff"
import { findEntityPasteConflict } from "../entity/entity-paste"

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
