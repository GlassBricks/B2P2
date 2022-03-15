import { Classes } from "../lib"
import { Layer } from "./Layer"
import { BlueprintPaste, MutableBlueprintPaste } from "../entity/Blueprint"

@Classes.register()
export class DataLayer implements Layer {
  private content: BlueprintPaste | undefined
  constructor(public name: string, content: BlueprintPaste = new MutableBlueprintPaste()) {
    this.content = content
  }

  getContent(): BlueprintPaste | undefined {
    return this.content
  }
  //
  // isValid(): boolean {
  //   return this.content !== undefined
  // }
  // dispose(): void {
  //   this.content = undefined
  // }
  // returns false if this is already disposed
  setContent(content: BlueprintPaste): boolean {
    // if (this.content === undefined) return false
    this.content = content
    return true
  }
}
