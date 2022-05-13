import { AreaIdentification } from "../../blueprint/AreaIdentification"
import { Blueprint } from "../../blueprint/Blueprint"
import { Colors } from "../../constants"
import { bbox } from "../../lib/geometry/bounding-box"
import { State } from "../../lib/observable"

export interface AssemblyImport {
  name(): State<LocalisedString>
  // undefined means is not valid
  content(): State<Blueprint | undefined>

  getRelativePosition(): MapPositionTable
  getRelativeBoundingBox(): BoundingBoxRead
  getSourceArea(): AreaIdentification | undefined
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
