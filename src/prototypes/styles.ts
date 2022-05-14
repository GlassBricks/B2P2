import { Data } from "typed-factorio/data/types"
import { GuiConstants, Styles } from "../constants"

declare const data: Data

const styles = data.raw["gui-style"].default

styles[Styles.ListBoxButton] = {
  type: "button_style",
  parent: "list_box_item",
  left_padding: 4,
  right_padding: 4,
  horizontally_squashable: "on",
  horizontally_stretchable: "on",
  disabled_graphical_set: styles.list_box_item.default_graphical_set,
  disabled_font_color: styles.list_box_item.default_font_color,
}

styles[Styles.ScrollPaneFakeListbox] = {
  type: "scroll_pane_style",
  parent: "scroll_pane_with_dark_background_under_subheader",
  extra_right_padding_when_activated: -12,
  background_graphical_set: {
    position: { x: 282, y: 17 },
    corner_size: 8,
    overall_tiling_vertical_size: 22,
    overall_tiling_vertical_spacing: 6,
    overall_tiling_vertical_padding: 4,
    overall_tiling_horizontal_padding: 4,
  },
  vertically_stretchable: "on",
  padding: 0,
  vertical_flow_style: {
    type: "vertical_flow_style",
    vertical_spacing: 0,
  },
}

styles[Styles.AMListScrollPane] = {
  type: "scroll_pane_style",
  parent: "scroll_pane_in_shallow_frame",
  extra_right_padding_when_activated: -12,
  vertically_stretchable: "on",
  horizontally_stretchable: "on",
  padding: 0,
  vertical_flow_style: {
    type: "vertical_flow_style",
    vertical_spacing: 0,
  },
  minimal_height: GuiConstants.AMListMinHeight,
  maximal_height: GuiConstants.AMListMaxHeight,
}
