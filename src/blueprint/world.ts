import { FullEntity, PlainEntity } from "../entity/entity"
import { isEmpty, Mutable } from "../lib"
import { BBox, pos, Position } from "../lib/geometry"
import { Blueprint } from "./Blueprint"
import { getTempBpItemStack, prepareBlueprintStack } from "./blueprint-items"
import { LuaBlueprint } from "./LuaBlueprint"

export function takeBlueprint(
  surface: SurfaceIdentification,
  area: BBox,
  worldTopLeft: Position = area.left_top,
): LuaBlueprint {
  const [bp] = takeBlueprintWithIndex(surface, area, worldTopLeft)
  return bp
}

export function takeBlueprintWithIndex(
  surface: SurfaceIdentification,
  area: BBox,
  worldTopLeft: Position = area.left_top,
): LuaMultiReturn<[LuaBlueprint, Record<number, LuaEntity>]> {
  const item = getTempBpItemStack()
  const index = takeBlueprintRaw(item, surface, area)
  if (isEmpty(index)) return $multi(LuaBlueprint.of(), {})
  const entities = item.get_blueprint_entities()! as Mutable<FullEntity>[]
  const targetPos = pos.sub(index[1].position, worldTopLeft)
  shiftEntitiesToMatchPosition(entities, targetPos)
  return $multi(LuaBlueprint._new(entities), index)
}

export function takeBlueprintRaw(
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

export function shiftEntitiesToMatchPosition(entities: PlainEntity[], firstEntityTargetPosition: Position): void {
  // const targetPos = pos.sub(firstEntityRealPosition, worldTopLeft)
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

function reviveGhost(ghost: GhostEntity): LuaEntity | undefined {
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
  for (const entity of attemptReRevive) {
    const revived = reviveGhost(entity)
    if (revived) {
      resultEntities.push(revived)
    } else {
      resultEntities.push(entity)
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
