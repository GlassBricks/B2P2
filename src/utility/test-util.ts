import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"

export function getScriptArea(
  surface: SurfaceIdentification,
  area: string | number | BoundingBox,
): [LuaSurface, BoundingBoxClass] {
  const _surface =
    (typeof surface === "object" ? surface : game.get_surface(surface)) ??
    error(`surface with name "${surface}" not found`)
  const _area =
    (typeof area === "object" ? area : _surface.get_script_area(area)?.area) ??
    error(`area with name ${area} not found`)
  return [_surface, bbox.normalize(_area)]
}
