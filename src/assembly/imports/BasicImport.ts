import { Classes } from "../../lib"
import { Import } from "./Import"
import { Assembly } from "../Assembly"
import { Blueprint } from "../../blueprint/Blueprint"
import { state, State } from "../../lib/observable"

@Classes.register()
export class BasicImport implements Import {
  private readonly name: State<LocalisedString>
  private readonly content: State<Blueprint | undefined>
  constructor(source: Assembly) {
    this.name = source.displayName
    this.content = source.getContent()?.resultContent ?? state(undefined)
  }
  getName(): State<LocalisedString> {
    return this.name
  }
  getContent(): State<Blueprint | undefined> {
    return this.content
  }
}
