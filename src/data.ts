import { Data } from "typed-factorio/data/types"
import { Prototypes, Sprites, Styles } from "./constants"
import * as util from "util"

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

styles[Styles.BareScrollPane] = {
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
}

const assemblyCreationTool = {
  type: "selection-tool",
  name: Prototypes.AssemblyCreationTool,
  // subgroup: "tool",
  order: "z[bbpp]-[single-selection-tool]",
  icon: "__bbpp__/graphics/selection-tool.png",
  icon_size: 64,
  flags: ["only-in-cursor", "hidden", "not-stackable"],
  stack_size: 1,
  stackable: false,
  selection_color: [250, 250, 250],
  selection_mode: ["nothing"],
  alt_selection_color: [250, 250, 250],
  alt_selection_mode: ["nothing"],
  selection_cursor_box_type: "entity",
  alt_selection_cursor_box_type: "entity",
}

const importPreview = {
  ...util.table.deepcopy(data.raw.blueprint.blueprint),
  name: Prototypes.ImportPreview,
  flags: ["only-in-cursor", "hidden"],
}

const importPreviewPositionMarker = {
  type: "simple-entity",
  name: Prototypes.ImportPreviewPositionMarker,
  pictures: [
    {
      filename: "__core__/graphics/empty.png",
      width: 1,
      height: 1,
      priority: "low",
    },
  ],
  time_before_removed: 1,
  flags: ["hidden", "player-creation"],
  collision_mask: [],
  placeable_by: {
    item: Prototypes.ImportPreviewPositionMarker,
    count: 1,
  },
}

const ippmItem = {
  type: "item",
  name: Prototypes.ImportPreviewPositionMarker,
  icon: "__core__/graphics/empty.png",
  icon_size: 1,
  stack_size: 1,
  flags: ["hidden"],
  place_result: Prototypes.ImportPreviewPositionMarker,
}

data.extend([assemblyCreationTool, importPreview, importPreviewPositionMarker, ippmItem])

const teleportBlackSprite = {
  type: "sprite",
  name: Sprites.TeleportBlack,
  filename: "__bbpp__/graphics/teleport-black.png",
  size: [32, 32],
}

const teleportWhiteSprite = {
  type: "sprite",
  name: Sprites.TeleportWhite,
  filename: "__bbpp__/graphics/teleport-white.png",
  size: [32, 32],
}

data.extend([teleportBlackSprite, teleportWhiteSprite])
