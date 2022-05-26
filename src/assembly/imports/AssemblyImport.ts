import { AreaIdentification } from "../../area/AreaIdentification"
import { Blueprint } from "../../blueprint/Blueprint"
import { Colors } from "../../constants"
import { FullEntity } from "../../entity/entity"
import { BBox, bbox } from "../../lib/geometry"
import { State } from "../../lib/observable"

export interface AssemblyImport {
  name(): State<LocalisedString>
  // undefined means is not valid
  content(): State<Blueprint<FullEntity> | undefined>

  getRelativeBoundingBox(): BBox
  getSourceArea(): AreaIdentification | undefined
}

export function highlightImport(surface: LuaSurface, area: BBox, imp: AssemblyImport, forPlayer: LuaPlayer): void {
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
