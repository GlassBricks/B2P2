import { FullEntity, PlainEntity } from "../entity/entity"
import { isEmpty, Mutable } from "../lib"
import { BBox, pos, Position } from "../lib/geometry"
import { Blueprint } from "./Blueprint"
import { getTempBpItemStack, prepareBlueprintStack } from "./blueprint-items"

export function takeBlueprint(
  surface: SurfaceIdentification,
  area: BBox,
  worldTopLeft: Position = area.left_top,
): FullEntity[] {
  const [entities] = takeBlueprintWithIndex(surface, area, worldTopLeft)
  return entities
}

export function takeBlueprintWithIndex(
  surface: SurfaceIdentification,
  area: BBox,
  worldTopLeft: Position = area.left_top,
): LuaMultiReturn<[FullEntity[], Record<number, LuaEntity>]> {
  const item = getTempBpItemStack()
  const [index, targetPos] = takeBlueprintUntranslated(item, surface, area, worldTopLeft)
  const entities = getShiftedEntities(item, targetPos)
  shiftEntitiesToMatchPosition(entities, targetPos)
  return $multi(entities, index)
}

function takeBlueprintRaw(
  stack: BlueprintItemStack,
  surface: SurfaceIdentification,
  area: BBox,
): Record<number, LuaEntity> {
  prepareBlueprintStack(stack)
  const index = stack.create_blueprint({
    surface,
    area,
    force: "player",
    include_station_names: true,
    include_trains: true,
  })
  if (isEmpty(index)) return {}
  return index
}

export function takeBlueprintUntranslated(
  stack: BlueprintItemStack,
  surface: SurfaceIdentification,
  area: BBox,
  worldTopLeft: Position = area.left_top,
): LuaMultiReturn<[Record<number, LuaEntity>, Position]> {
  const index = takeBlueprintRaw(stack, surface, area)
  const targetPos = !isEmpty(index) ? pos.sub(index[1].position, worldTopLeft) : { x: 0, y: 0 }
  return $multi(index, targetPos)
}

function shiftEntitiesToMatchPosition(entities: PlainEntity[], firstEntityTargetPosition: Position): void {
  // const targetPos = pos.sub(firstEntityRealPosition, worldTopLeft)
  if (!entities[0]) return
  const actualPos = entities[0].position
  const offset = pos.sub(firstEntityTargetPosition, actualPos)
  if (offset.x !== 0 || offset.y !== 0) {
    for (const entity of entities) {
      const position = entity.position as Mutable<Position>
      position.x += offset.x
      position.y += offset.y
    }
  }
}

export function getShiftedEntities(stack: BlueprintItemStack, firstEntityTargetPos: Position): PlainEntity[] {
  const entities = stack.get_blueprint_entities()
  if (!entities) return []
  shiftEntitiesToMatchPosition(entities, firstEntityTargetPos)
  return entities
}

function reviveGhost(ghost: GhostEntity): LuaEntity | undefined {
  if (!ghost.valid) return
  const [, entity, requestProxy] = ghost.silent_revive({
    return_item_request_proxy: true,
  })
  if (entity === undefined) return

  if (!requestProxy) return entity

  // manually add items from request proxy
  const requests = requestProxy.item_requests
  const moduleInventory = entity.get_module_inventory()
  if (moduleInventory) {
    for (const [item, amount] of pairs(requests)) {
      moduleInventory.insert({ name: item, count: amount })
    }
  } else {
    for (const [item, amount] of pairs(requests)) {
      entity.insert({ name: item, count: amount })
    }
  }
  requestProxy.destroy()
  return entity
}

export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: Position,
  blueprint: Blueprint<FullEntity>,
  revive: boolean = true,
): LuaEntity[] {
  const stack = blueprint.getStack()
  if (!stack) return []
  const ghosts = stack.build_blueprint({
    surface,
    position: location,
    force: "player",
    force_build: true,
    skip_fog_of_war: false,
  })

  if (!revive) return ghosts

  const resultEntities: LuaEntity[] = []
  const attemptReRevive: LuaEntity[] = []
  for (const ghost of ghosts) {
    const entity = reviveGhost(ghost)
    if (!entity) {
      attemptReRevive.push(ghost)
    } else {
      resultEntities.push(entity)
    }
  }
  for (const ghost of attemptReRevive) {
    const revived = reviveGhost(ghost)
    if (revived) {
      resultEntities.push(revived)
    } else if (ghost.valid) {
      resultEntities.push(ghost)
    }
  }
  return resultEntities
}

export function clearBuildableEntities(surface: SurfaceIdentification, area: BBox): void {
  const actualSurface =
    typeof surface === "object" ? surface : game.get_surface(surface) ?? error("surface not found: " + surface)
  const entities = actualSurface.find_entities_filtered({
    area,
    collision_mask: ["ghost-layer", "object-layer", "item-layer", "train-layer", "rail-layer"],
  })
  for (const entity of entities) {
    if (entity.type !== "character") entity.destroy()
  }
  const otherEntities = actualSurface.find_entities_filtered({
    area,
    type: ["item-request-proxy", "highlight-box"],
  })
  for (const entity of otherEntities) {
    entity.destroy()
  }
}
