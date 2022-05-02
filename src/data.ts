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
