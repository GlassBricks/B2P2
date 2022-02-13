export function getArea(
  surface: SurfaceIdentification,
  area: string | number | BoundingBox,
): [LuaSurface, BoundingBox] {
  const _surface =
    (typeof surface === "object" ? surface : game.get_surface(surface)) ??
    error(`surface with name "${surface}" not found`)
  const _area =
    (typeof area === "object" ? area : _surface.get_script_area(area)?.area) ??
    error(`area with name ${area} not found`)
  return [_surface, _area]
}
