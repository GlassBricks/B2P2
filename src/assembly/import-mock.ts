import { Blueprint } from "../blueprint/Blueprint"
import { Import } from "./Import"

export function mockImport(content: Blueprint): Import {
  return {
    getContent: () => content,
    isValid: () => true,
    getName: () => "",
  }
}

export function invalidMockImport(): Import {
  return {
    getContent: () => undefined,
    isValid: () => false,
    getName: () => "",
  }
}
