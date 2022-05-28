import { AreaIdentification } from "../../area/AreaIdentification"
import { Blueprint } from "../../blueprint/Blueprint"
import { FullEntity } from "../../entity/entity"
import { Classes, getAllInstances, raiseUserError } from "../../lib"
import { BBox, bbox, Position } from "../../lib/geometry"
import { Migrations } from "../../lib/migration"
import { State } from "../../lib/observable"
import { DependencyNode } from "../../lib/observable/DependencyNode"
import { L_Interaction } from "../../locale"
import { Assembly } from "../Assembly"
import { AssemblyImport } from "./AssemblyImport"

@Classes.register()
export class BasicImport implements AssemblyImport {
  private constructor(private readonly source: Assembly, readonly relativeBoundingBox: BBox) {}
  name(): State<LocalisedString> {
    return this.source.name
  }
  getContent(): Blueprint<FullEntity> | undefined {
    return this.source.getContent()?.resultContent
  }
  getRelativeBoundingBox(): BBox {
    return this.relativeBoundingBox
  }
  getSourceArea(): AreaIdentification | undefined {
    return this.source
  }
  getDependencyNode(): DependencyNode | undefined {
    return this.source.getContent()?.dependencyNode
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

Migrations.from("0.3.0", () => {
  interface OldBasicImport {
    _content?: State<Blueprint<FullEntity> | undefined>
  }
  for (const instance of getAllInstances(BasicImport)) {
    delete (instance as OldBasicImport)._content
  }
})
