import { bbox } from "../lib/geometry/bounding-box"
import center = bbox.center

export interface AreaIdentification {
  readonly surface: LuaSurface
  readonly area: BoundingBoxRead
}

export interface PositionIdentification {
  readonly surface: LuaSurface
  readonly position: MapPositionTable
}
export function highlightArea(
  location: AreaIdentification | undefined,
  highlightType: CursorBoxRenderType,
  additionalParams: Partial<HighlightBoxSurfaceCreateEntity> = {},
): HighlightBoxEntity | undefined {
  if (!location) return
  const area = location.area
  return location.surface.create_entity({
    name: "highlight-box",
    position: center(area),
    bounding_box: area,
    box_type: highlightType,
    ...additionalParams,
  })
}
