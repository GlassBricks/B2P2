import { AreaIdentification } from "../../area/AreaIdentification"
import { Blueprint } from "../../blueprint/Blueprint"
import { Classes, raiseUserError } from "../../lib"
import { BBox, bbox, Position } from "../../lib/geometry"
import { State } from "../../lib/observable"
import { L_Interaction } from "../../locale"
import { Assembly } from "../Assembly"
import { AssemblyImport } from "./AssemblyImport"

@Classes.register()
export class BasicImport implements AssemblyImport {
  private readonly _content: State<Blueprint | undefined>
  private constructor(private readonly source: Assembly, readonly relativeBoundingBox: BBox) {
    this._content = source.getContent()!.resultContent
  }
  name(): State<LocalisedString> {
    return this.source.name
  }
  content(): State<Blueprint | undefined> {
    return this._content
  }
  getRelativePosition(): Position {
    return this.relativeBoundingBox.left_top
  }
  getRelativeBoundingBox(): BBox {
    return this.relativeBoundingBox
  }
  getSourceArea(): AreaIdentification | undefined {
    return this.source
  }

  static createFor(source: Assembly, target: Assembly, relativePosition: Position): BasicImport {
    const sourceRelative = bbox.shiftToOrigin(source.area)
    const targetRelative = bbox.shiftToOrigin(target.area).shift(relativePosition)
    if (!bbox.intersectsNonZeroArea(sourceRelative, targetRelative))
      raiseUserError([L_Interaction.ImportDoesNotIntersectAssembly], "flying-text")
    return new BasicImport(source, targetRelative)
  }

  static _createUnchecked(source: Assembly, relativePosition: Position): AssemblyImport {
    const boundingBox = bbox.shiftToOrigin(source.area).shift(relativePosition)
    return new BasicImport(source, boundingBox)
  }
}
