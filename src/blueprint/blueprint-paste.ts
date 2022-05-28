import { oppositedirection } from "util"
import { AreaIdentification } from "../area/AreaIdentification"
import { Prototypes } from "../constants"
import {
  Entity,
  ErrorEntity,
  FullEntity,
  IntermediateEntity,
  PartialEntity,
  PasteEntity,
  PlainEntity,
  ReferenceEntity,
  UpdateablePasteEntity,
} from "../entity/entity"
import { applyEntityPaste, isCompatibleEntity } from "../entity/entity-paste"
import { Classes, Mutable, nilIfEmpty, shallowCopy } from "../lib"
import { BBox, bbox, pos, Position } from "../lib/geometry"
import { add as mapAdd, get, Map2D, MutableMap2D } from "../lib/map2d"
import { filterEntitiesInArea, LuaBlueprint, UpdateablePasteBlueprint } from "./LuaBlueprint"
import { pasteBlueprint } from "./world"
import add = pos.add
import floor = pos.floor
import sub = pos.sub

export function findCompatibleEntity<T extends Entity>(
  positionMap: MutableMap2D<T> | Map2D<T>,
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

export function toPartialEntity(entity: PlainEntity): PartialEntity {
  const result = shallowCopy(entity) as unknown as PartialEntity
  result.position = entity.position
  result.isPartialEntity = true
  return result
}
/**
 * Used to check for conflicts.
 */
@Classes.register()
export class PartialBlueprint {
  public entityMap: MutableMap2D<IntermediateEntity> = {}

  addPartial(entity: PasteEntity, position: Position): void {
    const { x, y } = position
    const newEntity = shallowCopy(entity) as unknown as PartialEntity
    newEntity.position = position
    newEntity.isPartialEntity = true
    mapAdd(this.entityMap, x, y, newEntity)
  }

  addErrorEntity(entity: PasteEntity, position: Position): void {
    const errEntity: ErrorEntity = {
      name: entity.name,
      position,
      direction: entity.direction,
      isErrorEntity: true,
    }
    const { x, y } = position
    mapAdd(this.entityMap, x, y, errEntity)
  }
}

export interface BlueprintPasteConflicts {
  readonly overlaps?: FullEntity[]
  readonly upgrades?: EntityPair[]
  readonly itemRequestChanges?: EntityPair[]
  readonly lostReferences?: ReferenceEntity[]
  readonly flippedUndergrounds?: FullEntity[]
}
export interface EntityPair {
  readonly below: FullEntity
  readonly above: PasteEntity
}

/**
 * Performance hotspot.
 *
 * @param area area (bounds) to place
 * @param belowContent existing entities; used to check for conflicts
 * @param content content to paste
 * @param pasteBounds location of content to paste
 */
export function pasteAndFindConflicts(
  area: AreaIdentification,
  belowContent: PartialBlueprint,
  content: UpdateablePasteBlueprint,
  pasteBounds: BBox,
): LuaMultiReturn<[BlueprintPasteConflicts, LuaEntity[]]> {
  const { surface, area: areaBounds } = area
  const areaTopLeft = areaBounds.left_top
  const actualBounds = bbox.intersect(areaBounds, pasteBounds).roundTile()
  const relativeBounds = bbox.shiftNegative(actualBounds, pasteBounds.left_top)

  const [unfilteredEntities, contentPositionMap] = content.getEntitiesAndPositionMap()

  const filteredEntities = filterEntitiesInArea(unfilteredEntities, relativeBounds)

  const pasteLocation = floor(pasteBounds.left_top)
  const relativePasteLocation = pos.sub(pasteLocation, areaTopLeft)

  const upgrades: EntityPair[] = []
  const itemRequestChanges: EntityPair[] = []

  const unaccountedEntities = new LuaSet<UpdateablePasteEntity>()

  // check every entity for corresponding entity in below content
  const belowMap = belowContent.entityMap
  for (const contentEntity of filteredEntities) {
    const contentEntityPos = contentEntity.position
    const relativeLocation = add(relativePasteLocation, contentEntityPos)
    const belowEntity = findCompatibleEntity(belowMap, contentEntity, relativeLocation)
    if (!belowEntity) {
      // new entity
      unaccountedEntities.add(contentEntity)
      continue
    }
    if (belowEntity.isErrorEntity) {
      // ignore checking
      continue
    }
    // this entity has matching entity
    const [upgraded, itemsChanged] = applyEntityPaste(belowEntity, contentEntity)
    if (itemsChanged) {
      itemRequestChanges.push({ below: belowEntity, above: contentEntity })
    }
    if (upgraded) {
      // try fast replace to upgrade
      const worldPosition = add(pasteLocation, contentEntityPos)
      const direction = contentEntity.direction
      if (
        surface.can_fast_replace({
          name: contentEntity.name,
          position: worldPosition,
          direction,
          force: "player",
        })
      ) {
        upgrades.push({ below: belowEntity, above: contentEntity })
        surface.create_entity({
          name: contentEntity.name,
          position: worldPosition,
          direction,
          fast_replace: true,
          force: "player",
          spill: false,
          create_build_effect_smoke: false,
        })
      } else {
        // consider to be possibly overlap
        unaccountedEntities.add(contentEntity)
      }
    }
  }

  const pastedEntities = pasteBlueprint(surface, pasteLocation, LuaBlueprint._new(filteredEntities))

  const overlaps: FullEntity[] = []
  const lostReferences: ReferenceEntity[] = []
  const flippedUndergrounds: FullEntity[] = []
  // find pasted blueprint entities
  for (const pastedEntity of pastedEntities) {
    const relativeLocation = sub(pastedEntity.position, pasteLocation)
    const refEntity: Mutable<Entity> = {
      name: pastedEntity.type === "entity-ghost" ? pastedEntity.ghost_name : pastedEntity.name,
      direction: pastedEntity.direction,
      position: relativeLocation,
    }
    let corresponding = findCompatibleEntity(contentPositionMap, refEntity, relativeLocation)
    if (corresponding === undefined) {
      // could be underground belt, that has been flipped
      const type = pastedEntity.type === "entity-ghost" ? pastedEntity.ghost_type : pastedEntity.type
      if (type === "underground-belt") {
        refEntity.direction = oppositedirection(pastedEntity.direction)
        corresponding = findCompatibleEntity(contentPositionMap, refEntity, relativeLocation)
      }
      if (corresponding === undefined) {
        error("bp entity corresponding to pasted lua entity not found: " + serpent.block(refEntity))
      }
      flippedUndergrounds.push(corresponding)
    }
    if (corresponding.changedProps) {
      // pasted, but is ref prop
      lostReferences.push(corresponding)
    }
    unaccountedEntities.delete(corresponding)
    const relativePosition = add(relativePasteLocation, corresponding.position)
    belowContent.addPartial(corresponding, relativePosition)
  }

  for (const [unpastedEntity] of unaccountedEntities) {
    // not pasted, not compatible: is overlap
    overlaps.push(unpastedEntity)

    const worldPosition = add(pasteLocation, unpastedEntity.position)

    const params: Mutable<BlueprintEntityRead & EntityGhostSurfaceCreateEntity> = shallowCopy(unpastedEntity) as any
    params.name = Prototypes.OverlappedGhost
    params.inner_name = unpastedEntity.name
    params.position = worldPosition
    params.force = "player"
    delete params.connections
    delete params.neighbours
    const entity = surface.create_entity(params)
    pastedEntities.push(entity!)
    // add error entity
    const relativeLocation = add(unpastedEntity.position, relativePasteLocation)
    belowContent.addErrorEntity(unpastedEntity, relativeLocation)
  }

  const conflicts: BlueprintPasteConflicts = {
    overlaps: nilIfEmpty(overlaps),
    upgrades: nilIfEmpty(upgrades),
    itemRequestChanges: nilIfEmpty(itemRequestChanges),
    lostReferences: nilIfEmpty(lostReferences),
    flippedUndergrounds: nilIfEmpty(flippedUndergrounds),
  }
  return $multi(conflicts, pastedEntities)
}
