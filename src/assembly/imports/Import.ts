import { Blueprint } from "../../blueprint/Blueprint"
import { State } from "../../lib/observable"

export interface Import {
  getName(): State<LocalisedString>
  // undefined means is not valid
  getContent(): State<Blueprint | undefined>
}
