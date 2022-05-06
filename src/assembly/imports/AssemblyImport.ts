import { Blueprint } from "../../blueprint/Blueprint"
import { State } from "../../lib/observable"
import { bbox } from "../../lib/geometry/bounding-box"
import { Colors } from "../../constants"

export interface AssemblyImport {
  getName(): State<LocalisedString>
  // undefined means is not valid
  getContent(): State<Blueprint | undefined>

  getRelativePosition(): MapPositionTable
  getRelativeBoundingBox(): BoundingBoxRead
}

export function highlightImport(
  surface: LuaSurface,
  area: BoundingBoxRead,
  imp: AssemblyImport,
  forPlayer: LuaPlayer,
): void {
  const importArea = bbox.intersect(area, bbox.shift(imp.getRelativeBoundingBox(), area.left_top))
  rendering.draw_rectangle({
    surface,
    filled: false,
    color: Colors.ImportHighlight,
    left_top: importArea.left_top,
    right_bottom: importArea.right_bottom,
    players: [forPlayer],
    time_to_live: 200,
  })
}
