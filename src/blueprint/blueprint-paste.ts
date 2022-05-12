import { ConflictingProp, Entity, FullEntity, getTileBox, PasteEntity, ReferenceEntity } from "../entity/entity"
import { findEntityPasteConflictAndUpdate, isCompatibleEntity } from "../entity/entity-paste"
import { bbox } from "../lib/geometry/bounding-box"
import { nilIfEmpty } from "../lib/util"
import { Blueprint, UpdateablePasteBlueprint } from "./Blueprint"

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

// may report compatible entities as overlapping
export function findOverlappingEntity<T extends Entity>(blueprint: Blueprint<T>, entity: Entity): T | undefined {
  for (const [x, y] of bbox.iterateTiles(getTileBox(entity))) {
    const entities = blueprint.getAtPos(x, y)
    if (entities !== undefined) {
      const entity = entities.first()
      if (entity !== undefined) return entity
    }
  }
  return undefined
}

export interface Overlap {
  readonly below: FullEntity
  readonly above: PasteEntity
}

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

export function findBlueprintPasteConflictsAndUpdate(
  below: Blueprint,
  above: UpdateablePasteBlueprint,
): BlueprintPasteConflicts {
  const overlaps: Overlap[] = []
  const propConflicts: PropConflict[] = []
  const lostReferences: ReferenceEntity[] = []
  for (const aboveEntity of above.entities) {
    const compatible = findCompatibleEntity(below, aboveEntity)
    if (compatible) {
      const conflict = findEntityPasteConflictAndUpdate(compatible, aboveEntity)
      if (conflict !== undefined) {
        propConflicts.push({
          above: aboveEntity,
          below: compatible,
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
  return {
    overlaps: nilIfEmpty(overlaps),
    propConflicts: nilIfEmpty(propConflicts),
    lostReferences: nilIfEmpty(lostReferences),
  }
}

export const findBlueprintPasteConflicts = (below: Blueprint, above: Blueprint): BlueprintPasteConflicts =>
  findBlueprintPasteConflictsAndUpdate(below, above)

export function findBlueprintPasteConflictsInWorld(
  surface: SurfaceIdentification,
  area: BoundingBoxRead,
  content: Blueprint,
  pasteLocation: MapPositionTable,
): BlueprintPasteConflicts {
  const contentArea = content.computeBoundingBox().shift(pasteLocation).intersect(area)
  const below = Blueprint.take(surface, contentArea, pasteLocation)
  return findBlueprintPasteConflicts(below, content)
}
