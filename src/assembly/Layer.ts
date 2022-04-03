import { BlueprintPaste } from "../entity/Blueprint"

export interface Layer {
  name: string
  /** Returns undefined if this is not valid. */
  getContent(): BlueprintPaste | undefined
  // isValid(): boolean
  // dispose(): void
}
