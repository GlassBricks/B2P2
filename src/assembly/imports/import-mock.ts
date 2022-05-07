import { Blueprint } from "../../blueprint/Blueprint"
import { AssemblyImport } from "./AssemblyImport"
import { state } from "../../lib/observable"
import { pos } from "../../lib/geometry/position"
import { bbox } from "../../lib/geometry/bounding-box"
import { AreaIdentification } from "../AreaIdentification"

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
