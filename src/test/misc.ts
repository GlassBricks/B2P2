import { get_area } from "__testorio__/testUtil/areas"
import { bbox, BoundingBoxClass } from "../lib/geometry"

export function getWorkingArea1(): [LuaSurface, BoundingBoxClass] {
  const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  return [surface1, bbox.normalize(area1)]
}
export function getWorkingArea2(): [LuaSurface, BoundingBoxClass] {
  const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 2")
  return [surface1, bbox.normalize(area1)]
}
