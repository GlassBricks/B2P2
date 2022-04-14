import { Blueprint } from "../blueprint/Blueprint"
import { ImportContent } from "./Import"

export function mockImport(content: Blueprint): ImportContent {
  return {
    getContents: () => content,
    isValid: () => true,
  }
}
