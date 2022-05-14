import { Data } from "typed-factorio/data/types"
import { copy } from "util"
import { Prototypes } from "../constants"

declare const data: Data

const ghostErrorEntity = {
  ...copy(data.raw["entity-ghost"]["entity-ghost"]),
  name: Prototypes.OverlappedGhost,
  selection_priority: 255,
}

data.extend([ghostErrorEntity])
