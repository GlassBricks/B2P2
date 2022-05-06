import { Classes, UserError } from "../../lib"
import { AssemblyImport } from "./AssemblyImport"
import { Assembly } from "../Assembly"
import { Blueprint } from "../../blueprint/Blueprint"
import { state, State } from "../../lib/observable"
import { bbox } from "../../lib/geometry/bounding-box"
import { L_Interaction } from "../../locale"

@Classes.register()
export class BasicImport implements AssemblyImport {
  private readonly name: State<LocalisedString>
  private readonly content: State<Blueprint | undefined>
  private constructor(source: Assembly, readonly relativeBoundingBox: BoundingBoxRead) {
    this.name = source.displayName
    this.content = source.getContent()?.resultContent ?? state(undefined)
  }
  getName(): State<LocalisedString> {
    return this.name
  }
  getContent(): State<Blueprint | undefined> {
    return this.content
  }
  getRelativePosition(): MapPositionTable {
    return this.relativeBoundingBox.left_top
  }
  getRelativeBoundingBox(): BoundingBoxRead {
    return this.relativeBoundingBox
  }

  static createFor(source: Assembly, target: Assembly, relativePosition: MapPositionTable): BasicImport {
    const sourceRelative = bbox.shiftToOrigin(source.area)
    const targetRelative = bbox.shiftToOrigin(target.area).shift(relativePosition)
    if (!bbox.intersectsNonZeroArea(sourceRelative, targetRelative))
      throw new UserError([L_Interaction.ImportDoesNotIntersectAssembly], "flying-text")
    return new BasicImport(source, targetRelative)
  }

  static _createUnchecked(source: Assembly, relativePosition: MapPositionTable): AssemblyImport {
    const boundingBox = bbox.shiftToOrigin(source.area).shift(relativePosition)
    return new BasicImport(source, boundingBox)
  }
}
