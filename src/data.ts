import { Data } from "typed-factorio/data/types"
import { Prototypes, Styles } from "./constants"

declare const data: Data

const styles = data.raw["gui-style"].default

styles[Styles.ListBoxButton] = {
  type: "button_style",
  parent: "list_box_item",
  left_padding: 4,
  right_padding: 4,
  horizontally_squashable: "on",
  horizontally_stretchable: "on",
}

const selectionTool = {
  type: "selection-tool",
  name: Prototypes.AssemblyCreationTool,
  subgroup: "tool",
  order: "z[bbpp]-[single-selection-tool]",
  icon: "__bbpp__/graphics/selection-tool.png",
  icon_size: 64,
  flags: ["only-in-cursor"],
  stack_size: 1,
  stackable: false,
  selection_color: [250, 250, 250],
  selection_mode: ["nothing"],
  alt_selection_color: [250, 250, 250],
  alt_selection_mode: ["nothing"],
  selection_cursor_box_type: "entity",
  alt_selection_cursor_box_type: "entity",
}

data.extend([selectionTool])
