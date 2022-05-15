import { Data } from "typed-factorio/data/types"
import { L_TipsAndTricksItemName } from "../locale"

interface TipsAndTricksItem {
  name: string
  type: "tips-and-tricks-item"
  category?: string
  dependencies?: string[]
  image?: string
  indent?: uint8
  is_title?: boolean
  starting_status?: StartingStatus
}

type StartingStatus =
  | "locked"
  | "optional"
  | "dependencies-not-met"
  | "unlocked"
  | "suggested"
  | "not-to-be-suggested"
  | "completed-without-tutorial"
  | "completed"

const category = {
  type: "tips-and-tricks-item-category",
  name: "b2p2",
  order: "z[b2p2]",
}

const allTipsAndTricks: Record<
  keyof typeof L_TipsAndTricksItemName,
  {
    indent: uint8
    starting_status?: StartingStatus
    is_title?: boolean
  }
> = {
  Introduction: { indent: 0, starting_status: "suggested", is_title: true },
  Assemblies: { indent: 1 },
  AssemblyManagement: { indent: 2 },
  Imports: { indent: 1 },
  ImportsReferenceEntities: { indent: 2 },
  Diagnostics: { indent: 1 },
  DiagnosticsOverlap: { indent: 2 },
  DiagnosticsUpgrades: { indent: 2 },
  DiagnosticsItemRequests: { indent: 2 },
  Navigation: { indent: 1 },
  Feedback: { indent: 1 },
}
function pascalToKebabCase(s: string) {
  const [sub] = string.gsub(s, "([A-Z])", "-%1")
  return string.lower(sub).substring(1)
}

let order = 1
const items: TipsAndTricksItem[] = Object.entries(allTipsAndTricks).map(
  ([pascalName, { indent, starting_status, is_title }]) => ({
    name: "b2p2:" + pascalToKebabCase(pascalName),
    type: "tips-and-tricks-item",
    category: "b2p2",
    indent,
    is_title,
    starting_status: starting_status ?? "unlocked",
    order: string.format("%03d", order++),
  }),
)

declare const data: Data
data.extend([category])
data.extend(items)
