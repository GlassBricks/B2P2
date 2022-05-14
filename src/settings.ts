import { Data } from "typed-factorio/settings/types"
import { Settings } from "./constants"

declare const data: Data

data.extend([
  {
    type: "bool-setting",
    setting_type: "runtime-per-user",
    name: Settings.Autosave,
    default_value: false,
    order: "z[b2p2]-[autosave]",
  },
])
