import { Blueprint } from "../blueprint/Blueprint"

export interface Import {
  getName(): string
  // undefined means is not valid
  getContent(): Blueprint | undefined
  isValid(): boolean
}
