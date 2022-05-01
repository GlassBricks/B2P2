import { Blueprint } from "../../blueprint/Blueprint"
import { State } from "../../lib/observable"

export interface AssemblyImport {
  getName(): State<LocalisedString>
  // undefined means is not valid
  getContent(): State<Blueprint | undefined>

  getRelativePosition(): MapPositionTable
}
