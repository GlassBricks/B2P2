import { Blueprint } from "../../blueprint/Blueprint"
import { AssemblyImport } from "./AssemblyImport"
import { state } from "../../lib/observable"
import { pos } from "../../lib/geometry/position"

export function mockImport(content: Blueprint, relativePosition: MapPositionTable = pos(0, 0)): AssemblyImport {
  const c = state(content)
  const name = state("")
  return {
    getContent: () => c,
    getName: () => name,
    getRelativePosition: () => relativePosition,
  }
}

export function invalidMockImport(relativePosition: MapPositionTable = pos(0, 0)): AssemblyImport {
  const c = state(undefined)
  const name = state("")
  return {
    getContent: () => c,
    getName: () => name,
    getRelativePosition: () => relativePosition,
  }
}
