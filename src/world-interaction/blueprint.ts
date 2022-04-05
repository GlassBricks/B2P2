import { isEmpty } from "../lib/util"
import { pos } from "../lib/geometry/position"
import { Mutable } from "../lib/util-types"
import { getTempItemStack } from "./temp-item-stack"
import { getPlayer } from "../lib/testUtil"
import { bbox } from "../lib/geometry/bounding-box"

export function takeBlueprint(surface: SurfaceIdentification, box: BoundingBox): BlueprintEntityRead[] {
  const area = bbox.normalize(box)
  const item = getTempItemStack()
  item.set_stack("blueprint")
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
): LuaEntity[] {
  if (entities.length === 0) return []

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

export function clearArea(surface: SurfaceIdentification, area: BoundingBoxRead): void {
  const actualSurface =
    typeof surface === "object" ? surface : game.get_surface(surface) ?? error("surface not found: " + surface)
  const entities = actualSurface.find_entities(area)
  for (const entity of entities) {
    entity.destroy()
  }
}
