import { Blueprint } from "../blueprint/Blueprint"
import { Import } from "./Import"

export function mockImport(content: Blueprint): Import {
  return {
    getContents: () => content,
    isValid: () => true,
  }
}

export function invalidMockImport(): Import {
  return {
    getContents: () => undefined,
    isValid: () => false,
  }
}
