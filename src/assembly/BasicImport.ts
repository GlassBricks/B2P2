import { Import } from "./Import"
import { Assembly } from "./Assembly"
import { Blueprint } from "../blueprint/Blueprint"
import { Classes } from "../lib"

@Classes.register()
export class BasicImport implements Import {
  constructor(private readonly assembly: Assembly) {}
  getContents(): Blueprint | undefined {
    return this.assembly.getLastResultContent()
  }
  isValid(): boolean {
    return this.assembly.isValid()
  }
}
