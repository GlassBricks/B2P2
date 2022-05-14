import { Data } from "typed-factorio/data/types"
import { Inputs, Prototypes } from "../constants"

declare const data: Data

const teleportToSource = {
  type: "custom-input",
  name: Inputs.TeleportToSource,
  key_sequence: "CONTROL + SHIFT + T",
}
const teleportForward = {
  type: "custom-input",
  name: Inputs.TeleportForward,
  key_sequence: "CONTROL + SHIFT + RIGHT",
  alternative_key_sequence: "CONTROL + mouse-button-5",
}
const teleportBackward = {
  type: "custom-input",
  name: Inputs.TeleportBackward,
  key_sequence: "CONTROL + SHIFT + LEFT",
  alternative_key_sequence: "CONTROL + mouse-button-4",
}

const createNewAssembly = {
  type: "custom-input",
  name: Prototypes.CreateAssembly,
  action: "spawn-item",
  item_to_spawn: Prototypes.AssemblyCreationTool,
  key_sequence: "", // no default
}

data.extend([teleportToSource, teleportForward, teleportBackward, createNewAssembly])
