import { Classes, raiseUserError } from "../../lib"
import { AssemblyImport } from "./AssemblyImport"
import { Assembly } from "../Assembly"
import { Blueprint } from "../../blueprint/Blueprint"
import { State } from "../../lib/observable"
import { bbox } from "../../lib/geometry/bounding-box"
import { L_Interaction } from "../../locale"
import { AreaIdentification } from "../AreaIdentification"

@Classes.register()
export class BasicImport implements AssemblyImport {
  private readonly _content: State<Blueprint | undefined>
  private constructor(private readonly source: Assembly, readonly relativeBoundingBox: BoundingBoxRead) {
    this._content = source.getContent()!.resultContent
  }
  name(): State<LocalisedString> {
    return this.source.name
  }
  content(): State<Blueprint | undefined> {
    return this._content
  }
  getRelativePosition(): MapPositionTable {
    return this.relativeBoundingBox.left_top
  }
  getRelativeBoundingBox(): BoundingBoxRead {
    return this.relativeBoundingBox
  }
  getSourceArea(): AreaIdentification | undefined {
    return this.source
  }

  static createFor(source: Assembly, target: Assembly, relativePosition: MapPositionTable): BasicImport {
    const sourceRelative = bbox.shiftToOrigin(source.area)
    const targetRelative = bbox.shiftToOrigin(target.area).shift(relativePosition)
    if (!bbox.intersectsNonZeroArea(sourceRelative, targetRelative))
      raiseUserError([L_Interaction.ImportDoesNotIntersectAssembly], "flying-text")
    return new BasicImport(source, targetRelative)
  }

  static _createUnchecked(source: Assembly, relativePosition: MapPositionTable): AssemblyImport {
    const boundingBox = bbox.shiftToOrigin(source.area).shift(relativePosition)
    return new BasicImport(source, boundingBox)
  }
}
