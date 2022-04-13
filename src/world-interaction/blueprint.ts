import { isEmpty } from "../lib/util"
import { pos } from "../lib/geometry/position"
import { Mutable } from "../lib/util-types"
import { getPlayer } from "../lib/testUtil"
import { bbox } from "../lib/geometry/bounding-box"
import { Entity } from "../entity/entity"

declare const global: {
  __tempBlueprintInventory: LuaInventory
}

function getTempItemStack(): BlueprintItemStack {
  const inventory = (global.__tempBlueprintInventory ??= game.create_inventory(1))[0]
  inventory.set_stack("blueprint")
  return inventory
}
export function takeBlueprint(surface: SurfaceIdentification, box: BoundingBox): BlueprintEntityRead[] {
  const area = bbox.normalize(box)
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
  const targetPos = pos.sub(index[1].position, area.left_top)
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

const debugAdapterEnabled = script.active_mods.debugadapter !== undefined
export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: readonly BlueprintEntityRead[],
): LuaEntity[]
export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: readonly Entity[],
  areaRestriction?: BoundingBox,
): LuaEntity[]
export function pasteBlueprint(
  surface: SurfaceIdentification,
  location: MapPositionTable,
  entities: readonly BlueprintEntityRead[],
  areaRestriction?: BoundingBox,
): LuaEntity[] {
  if (entities.length === 0) return []

  if (areaRestriction) {
    // for performance reasons, instead of creating a new list, we remove entities outside the area and restore them later
    const area = bbox.normalize(areaRestriction).shiftNegative(location)
    entities = (entities as Entity[]).filter((entity) => {
      const entityBox = entity.tileBox
      return area.contains(entityBox.left_top) && area.contains(entityBox.right_bottom)
    })
  }

  const stack = getTempItemStack()
  stack.set_stack("blueprint")
  stack.blueprint_snap_to_grid = [1, 1]
  stack.blueprint_absolute_snapping = true
  stack.set_blueprint_entities(entities)
  if (debugAdapterEnabled) {
    getPlayer().insert(stack)
  }
  return stack.build_blueprint({
    surface,
    position: location,
    force: "player",
    force_build: true,
    skip_fog_of_war: false,
  })
}

export function clearBuildableEntities(surface: SurfaceIdentification, area: BoundingBoxRead): void {
  const actualSurface =
    typeof surface === "object" ? surface : game.get_surface(surface) ?? error("surface not found: " + surface)
  const entities = actualSurface.find_entities_filtered({
    area,
    collision_mask: ["ghost-layer", "object-layer"],
  })
  for (const entity of entities) {
    if (entity.type !== "character") entity.destroy()
  }
}
