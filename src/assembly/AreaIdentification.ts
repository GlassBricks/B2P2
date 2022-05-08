import { bbox } from "../lib/geometry/bounding-box"

export interface AreaIdentification {
  readonly surface: LuaSurface
  readonly area: BoundingBoxRead
}

export function teleportPlayer(player: LuaPlayer, area: AreaIdentification): void {
  player.teleport(bbox.center(area.area), area.surface)
}
