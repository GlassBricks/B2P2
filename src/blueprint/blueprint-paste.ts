import { Prototypes } from "../constants"
import { Entity, FullEntity, PasteEntity, PlainEntity, ReferenceEntity } from "../entity/entity"
import { findEntityPasteConflictAndUpdate, isCompatibleEntity } from "../entity/entity-paste"
import { Mutable, nilIfEmpty } from "../lib"
import { BBox, bbox, pos, Position } from "../lib/geometry"
import { get, Map2D } from "../lib/map2d"
import { createEntityMap } from "./Blueprint"
import { filterEntitiesInArea, LuaBlueprint, UpdateablePasteBlueprint } from "./LuaBlueprint"
import { pasteBlueprint, takeBlueprintWithIndex } from "./world"
import add = pos.add
import floor = pos.floor
import sub = pos.sub

export function findCompatibleEntity<T extends Entity>(
  positionMap: Map2D<T>,
  entity: Entity,
  position: Position = entity.position,
): T | undefined {
  const entities = get(positionMap, position.x, position.y)
  if (entities === undefined) return undefined
  for (const [e] of entities) {
    if (isCompatibleEntity(e, entity, position)) return e
  }
  return undefined
}

export interface BlueprintPasteOptions {
  readonly allowUpgrades?: boolean
}

export interface BlueprintPasteConflicts {
  readonly overlaps?: Overlap[]
  readonly upgrades?: EntityPair[]
  readonly itemRequestChanges?: EntityPair[]
  readonly lostReferences?: ReferenceEntity[]
}
export type Overlap = FullEntity

export interface EntityPair {
  readonly below: FullEntity
  readonly above: PasteEntity
}

export function pasteAndFindConflicts(
  surface: LuaSurface,
  pasteBounds: BBox,
  content: UpdateablePasteBlueprint,
  contentBounds: BBox,
  options: BlueprintPasteOptions = {},
): LuaMultiReturn<[BlueprintPasteConflicts, LuaEntity[]]> {
  const actualBounds = bbox.intersect(pasteBounds, contentBounds).roundTile()
  const relativeBounds = bbox.shiftNegative(actualBounds, contentBounds.left_top)

  const filteredContent = filterEntitiesInArea(content.getEntities(), relativeBounds)
  const filteredContentMap = createEntityMap(filteredContent)

  const pasteLocation = floor(contentBounds.left_top)
  const [belowEntities, belowIndex] = takeBlueprintWithIndex(surface, actualBounds, pasteLocation)

  const contentBp = LuaBlueprint._new(filteredContent)
  const pastedEntities = pasteBlueprint(surface, pasteLocation, contentBp)

  // find pasted blueprint entities
  const pastedBPEntities = new LuaSet<Entity>()
  for (const pastedEntity of pastedEntities) {
    const relativeLocation = sub(pastedEntity.position, pasteLocation)
    const refEntity: Entity = {
      name: pastedEntity.type === "entity-ghost" ? pastedEntity.ghost_name : pastedEntity.name,
      direction: pastedEntity.direction,
      position: relativeLocation,
    }
    const corresponding = findCompatibleEntity(filteredContentMap, refEntity, relativeLocation)
    if (corresponding === undefined) {
      error("bp entity corresponding to pasted lua entity not found")
    }
    pastedBPEntities.add(corresponding)
  }

  // build luaEntity -> blueprint entity map
  const toBPEntityMap = new LuaMap<UnitNumber, PlainEntity>()
  for (const [entityNumber, luaEntity] of pairs(belowIndex)) {
    toBPEntityMap.set(luaEntity.unit_number!, belowEntities[entityNumber - 1])
  }

  // find conflicts
  const overlaps: Overlap[] = []
  const upgrades: EntityPair[] = []
  const itemRequestChanges: EntityPair[] = []
  const lostReferences: ReferenceEntity[] = []

  let shouldRepaste = false

  for (const aboveBpEntity of filteredContent) {
    if (pastedBPEntities.has(aboveBpEntity)) {
      // already pasted
      if (aboveBpEntity.changedProps) {
        lostReferences.push(aboveBpEntity)
      }
      continue
    }
    // not pasted
    // try to find corresponding entity in world
    const worldPosition = add(aboveBpEntity.position, pasteLocation)
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
      shouldRepaste = true // in case of updates
      if (conflict === "name") {
        upgrades.push({ below: belowBpEntity, above: aboveBpEntity })
        if (options.allowUpgrades) {
          surface.create_entity({
            name: aboveBpEntity.name,
            position: worldPosition,
            direction: aboveBpEntity.direction,
            fast_replace: true,
            force: "player",
            spill: false,
            create_build_effect_smoke: false,
          })
        }
      } else if (conflict === "items") {
        itemRequestChanges.push({ below: belowBpEntity, above: aboveBpEntity })
      }
    } else {
      // must intersect something
      overlaps.push(aboveBpEntity)
      const params = {
        ...aboveBpEntity,
        name: Prototypes.OverlappedGhost,
        inner_name: aboveBpEntity.name,
        position: worldPosition,
        force: "player",
      } as Mutable<BlueprintEntityRead> & EntityGhostSurfaceCreateEntity
      delete params.connections
      delete params.neighbours
      const entity = surface.create_entity(params)
      pastedEntities.push(entity!)
    }
  }

  if (shouldRepaste) {
    pasteBlueprint(surface, pasteLocation, contentBp, false)
  }

  const conflicts: BlueprintPasteConflicts = {
    overlaps: nilIfEmpty(overlaps),
    upgrades: nilIfEmpty(upgrades),
    itemRequestChanges: nilIfEmpty(itemRequestChanges),
    lostReferences: nilIfEmpty(lostReferences),
  }
  return $multi(conflicts, pastedEntities)
}
