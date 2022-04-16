import { ConflictingProp, Entity, EntityNumber, PasteEntity, PlainEntity, ReferenceEntity } from "../entity/entity"
import {
  Blueprint,
  getBlueprintFromWorld,
  MutableBlueprint,
  PasteBlueprint,
  UpdateablePasteBlueprint,
} from "./Blueprint"
import { computeEntityDiff, findEntityPasteConflictAndUpdate, isCompatibleEntity } from "../entity/entity-paste"
import { bbox } from "../lib/geometry/bounding-box"

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

// may report compatible entities as overlapping
export function findOverlappingEntity<T extends Entity>(blueprint: Blueprint<T>, entity: Entity): T | undefined {
  for (const [x, y] of bbox.iterateTiles(entity.tileBox)) {
    const entities = blueprint.getAtPos(x, y)
    if (entities !== undefined) {
      const entity = entities.first()
      if (entity !== undefined) return entity
    }
  }
  return undefined
}

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
  return { overlaps, propConflicts, lostReferences }
}

export const findBlueprintPasteConflicts = (below: Blueprint, above: Blueprint): BlueprintPasteConflicts =>
  findBlueprintPasteConflictAndUpdate(below, above)

export function findBlueprintPasteConflictsInWorldAndUpdate(
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
