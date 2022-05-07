import {
  ConflictingProp,
  Entity,
  EntityNumber,
  FullEntity,
  getTileBox,
  PasteEntity,
  PlainEntity,
  ReferenceEntity,
} from "../entity/entity"
import { Blueprint, PasteBlueprint, UpdateablePasteBlueprint } from "./Blueprint"
import {
  computeEntityDiff,
  createReferenceOnlyEntity,
  findEntityPasteConflictAndUpdate,
  isCompatibleEntity,
} from "../entity/entity-paste"
import { bbox } from "../lib/geometry/bounding-box"
import { nilIfEmpty } from "../lib/util"

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
