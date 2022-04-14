import { Blueprint } from "../blueprint/Blueprint"

export interface Import {
  // undefined means is not valid
  getContents(): Blueprint | undefined
  isValid(): boolean
}
