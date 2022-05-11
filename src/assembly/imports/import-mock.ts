import { Blueprint } from "../../blueprint/Blueprint"
import { bbox } from "../../lib/geometry/bounding-box"
import { pos } from "../../lib/geometry/position"
import { state } from "../../lib/observable"
import { AreaIdentification } from "../AreaIdentification"
import { AssemblyImport } from "./AssemblyImport"

export function mockImport(
  content: Blueprint,
  relativePosition: MapPositionTable = pos(0, 0),
  sourceArea: AreaIdentification | undefined = undefined,
): AssemblyImport {
  const c = state(content)
  const name = state("")
  return {
    content: () => c,
    name: () => name,
    getRelativePosition: () => relativePosition,
    getRelativeBoundingBox: () => content.computeBoundingBox().shift(relativePosition),
    getSourceArea: () => sourceArea,
  }
}

export function invalidMockImport(relativePosition: MapPositionTable = pos(0, 0)): AssemblyImport {
  const c = state(undefined)
  const name = state("")
  return {
    content: () => c,
    name: () => name,
    getRelativePosition: () => relativePosition,
    getRelativeBoundingBox: () => bbox.fromCorners(0, 0, 0, 0),
    getSourceArea: () => undefined,
  }
}
