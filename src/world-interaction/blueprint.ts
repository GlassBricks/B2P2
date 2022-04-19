import { isEmpty } from "../lib/util"
import { pos } from "../lib/geometry/position"
import { Mutable, RRecord } from "../lib/util-types"
import { getPlayer } from "../lib/testUtil"
import { bbox } from "../lib/geometry/bounding-box"
import { Entity, getTileBox } from "../entity/entity"

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
  area: BoundingBoxRead,
  worldTopLeft: MapPositionTable = area.left_top,
): BlueprintEntityRead[] {
  const item = getTempItemStack()
  const index = item.create_blueprint({
    surface,
    area,
    force: "player",
    include_station_names: true,
    include_trains: true,
  })
  if (isEmpty(index)) return []
  const entities = item.get_blueprint_entities()! as Mutable<BlueprintEntityRead>[]
  const targetPos = pos.sub(index[1].position, worldTopLeft)
  const actualPos = item.get_blueprint_entities()![0].position
  const offset = pos.sub(targetPos, actualPos)
  if (offset.x !== 0 || offset.y !== 0) {
    for (const entity of entities) {
      const position = entity.position as Mutable<MapPositionTable>
      position.x += offset.x
      position.y += offset.y
    }
  }
  return entities
}

function reviveGhost(ghost: GhostEntity): boolean {
  const [, entity, requestProxy] = ghost.silent_revive({
    return_item_request_proxy: true,
  })
  if (entity === undefined) return false

  if (!requestProxy) return true

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
  return true
}

export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: readonly BlueprintEntityRead[],
): void
export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: readonly Entity[] | RRecord<number, Entity>,
  areaRestriction?: BoundingBox,
): void
export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: Record<number, BlueprintEntityRead>,
  areaRestriction?: BoundingBox,
): void {
  if (isEmpty(entities)) return

  if (areaRestriction) {
    // for performance reasons, instead of creating a new list, we remove entities outside the area and restore them later
    const area = bbox.normalize(areaRestriction).shiftNegative(location)
    entities = (entities as Entity[]).filter((entity) => {
      const entityBox = getTileBox(entity)
      return area.contains(entityBox.left_top) && area.contains(entityBox.right_bottom)
    })
  }

  const stack = getTempItemStack()
  stack.set_stack("blueprint")
  stack.blueprint_snap_to_grid = [1, 1]
  stack.blueprint_absolute_snapping = true
  stack.set_blueprint_entities(entities as BlueprintEntityRead[])
  if (__DebugAdapter) {
    getPlayer().insert(stack)
  }
  const ghosts = stack.build_blueprint({
    surface,
    position: location,
    force: "player",
    force_build: true,
    skip_fog_of_war: false,
  })
  const attemptReRevive: LuaEntity[] = []
  for (const ghost of ghosts) {
    if (!reviveGhost(ghost)) {
      attemptReRevive.push(ghost)
    }
  }
  for (const entity of attemptReRevive) {
    reviveGhost(entity)
  }
}

export function clearBuildableEntities(surface: SurfaceIdentification, area: BoundingBoxRead): void {
  const actualSurface =
    typeof surface === "object" ? surface : game.get_surface(surface) ?? error("surface not found: " + surface)
  const entities = actualSurface.find_entities_filtered({
    area,
    collision_mask: ["ghost-layer", "object-layer", "item-layer"],
  })
  for (const entity of entities) {
    if (entity.type !== "character") entity.destroy()
  }
  const otherEntities = actualSurface.find_entities_filtered({
    type: "item-request-proxy",
  })
  for (const entity of otherEntities) {
    entity.destroy()
  }
}
