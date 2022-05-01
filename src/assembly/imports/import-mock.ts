import { Blueprint } from "../../blueprint/Blueprint"
import { Import } from "./Import"
import { state } from "../../lib/observable"

export function mockImport(content: Blueprint): Import {
  const c = state(content)
  const name = state("")
  return {
    getContent: () => c,
    getName: () => name,
  }
}

export function invalidMockImport(): Import {
  const c = state(undefined)
  const name = state("")
  return {
    getContent: () => c,
    getName: () => name,
  }
}
