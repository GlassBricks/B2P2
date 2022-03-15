import { Data } from "typed-factorio/settings/types"

declare const data: Data
declare function __datestamp(): string

data.extend([
  {
    type: "bool-setting",
    name: "dev-reload-" + __datestamp(),
    setting_type: "startup",
    default_value: false,
  },
])
