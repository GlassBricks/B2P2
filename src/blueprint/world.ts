import { FullEntity } from "../entity/entity"
import { isEmpty, Mutable } from "../lib"
import { BBox, pos, Position } from "../lib/geometry"

declare const global: {
  __tempBlueprintInventory: LuaInventory
}

function getTempItemStack(): BlueprintItemStack {
  const inventory = (global.__tempBlueprintInventory ??= game.create_inventory(1))[0]
  inventory.set_stack("blueprint")
  return inventory
}
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
  const item = getTempItemStack()
  const index = item.create_blueprint({
    surface,
    area,
    force: "player",
    include_station_names: true,
    include_trains: true,
  })
  if (isEmpty(index)) return $multi([], {})
  const entities = item.get_blueprint_entities()! as Mutable<FullEntity>[]
  const targetPos = pos.sub(index[1].position, worldTopLeft)
  const actualPos = item.get_blueprint_entities()![0].position
  const offset = pos.sub(targetPos, actualPos)
  if (offset.x !== 0 || offset.y !== 0) {
    for (const entity of entities) {
      const position = entity.position as Mutable<Position>
      position.x += offset.x
      position.y += offset.y
    }
  }
  return $multi(entities, index)
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
  entities: readonly BlueprintEntityRead[],
  revive: boolean = true,
): LuaEntity[] {
  if (isEmpty(entities)) return []

  const stack = getTempItemStack()
  stack.set_stack("blueprint")
  stack.blueprint_snap_to_grid = [2, 2] // 2x2 so that rails can fit
  stack.blueprint_absolute_snapping = true
  stack.set_blueprint_entities(entities)
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
