import { AreaIdentification } from "../../area/AreaIdentification"
import { Blueprint } from "../../blueprint/Blueprint"
import { FullEntity } from "../../entity/entity"
import { bbox, pos, Position } from "../../lib/geometry"
import { state } from "../../lib/observable"
import { AssemblyImport } from "./AssemblyImport"

export function mockImport(
  content: Blueprint<FullEntity>,
  relativePosition: Position = pos(0, 0),
  sourceArea: AreaIdentification | undefined = undefined,
): AssemblyImport {
  const name = state("")
  return {
    getContent: () => content,
    name: () => name,
    getRelativeBoundingBox: () => {
      let maxX = 0
      let maxY = 0
      for (const entity of content.getEntities()) {
        maxX = Math.max(maxX, entity.position.x)
        maxY = Math.max(maxY, entity.position.y)
      }
      return bbox.fromCoords(
        relativePosition.x,
        relativePosition.y,
        relativePosition.x + maxX,
        relativePosition.y + maxY,
      )
    },
    getSourceArea: () => sourceArea,
  }
}

export function invalidMockImport(relativePosition: Position = pos(0, 0)): AssemblyImport {
  const name = state("")
  return {
    getContent: () => undefined,
    name: () => name,
    getRelativeBoundingBox: () => ({ left_top: relativePosition, right_bottom: relativePosition }),
    getSourceArea: () => undefined,
  }
}
