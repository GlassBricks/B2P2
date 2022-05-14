import { Data } from "typed-factorio/data/types"
import * as util from "util"
import { GuiConstants, Inputs, Prototypes, Sprites, Styles } from "./constants"

declare const data: Data

// styles
{
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
}

// prototypes
{
  const assemblyCreationTool = {
    type: "selection-tool",
    name: Prototypes.AssemblyCreationTool,
    // subgroup: "tool",
    order: "z[bbpp]-[assembly-creation-tool]",
    icon: "__bbpp__/graphics/add-assembly.png",
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
  }

  const ippmItem = {
    type: "item",
    name: Prototypes.ImportPreviewPositionMarker,
    icon: "__core__/graphics/spawn-flag.png",
    icon_size: 64,
    stack_size: 1,
    flags: ["hidden"],
    place_result: Prototypes.ImportPreviewPositionMarker,
  }

  const labWhite = "__base__/graphics/terrain/lab-tiles/lab-white.png"
  const etherealWhiteTile = {
    type: "simple-entity",
    name: Prototypes.ImportPreviewBoundaryTile,
    icon: labWhite,
    icon_size: 32,
    picture: {
      filename: labWhite,
      size: 32,
    },
    tile_width: 1,
    tile_height: 1,
    collision_mask: [],
    flags: ["hidden", "player-creation"],
  }

  const ipemItem = {
    type: "item",
    name: Prototypes.ImportPreviewBoundaryTile,
    icon: labWhite,
    icon_size: 32,
    stack_size: 1,
    place_result: Prototypes.ImportPreviewBoundaryTile,
    flags: ["hidden"],
  }

  data.extend([assemblyCreationTool, importPreview, importPreviewPositionMarker, ippmItem, etherealWhiteTile, ipemItem])
}

// inputs
{
  const teleportToSource = {
    type: "custom-input",
    name: Inputs.TeleportToSource,
    key_sequence: "CONTROL + SHIFT + T",
  }

  data.extend([teleportToSource])
}

// sprites
{
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
}
