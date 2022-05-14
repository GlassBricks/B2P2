// prototypes
import { Data } from "typed-factorio/data/types"
import * as util from "util"
import { Prototypes } from "../constants"
import { PRecord } from "../lib"
import deepcopy = util.table.deepcopy

declare const data: Data
const assemblyCreationTool = {
  type: "selection-tool",
  name: Prototypes.AssemblyCreationTool,
  subgroup: "tool",
  order: "c[bbpp]-[assembly-creation-tool]",
  icon: "__bbpp__/graphics/add-assembly.png",
  icon_size: 64,
  flags: ["only-in-cursor", "hidden", "not-stackable", "spawnable"],
  stack_size: 1,
  selection_color: [250, 250, 250],
  selection_mode: ["blueprint"],
  alt_selection_color: [250, 250, 250],
  alt_selection_mode: ["nothing"],
  selection_cursor_box_type: "entity",
  alt_selection_cursor_box_type: "entity",
}

const importPreview = {
  ...deepcopy(data.raw.blueprint.blueprint),
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
  flags: ["hidden", "player-creation"],
  collision_mask: [],
}

const importPreviewPositionItem = {
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

const importPreviewTileItem = {
  type: "item",
  name: Prototypes.ImportPreviewBoundaryTile,
  icon: labWhite,
  icon_size: 32,
  stack_size: 1,
  place_result: Prototypes.ImportPreviewBoundaryTile,
  flags: ["hidden"],
}

const blueprintShortcut = deepcopy(data.raw.shortcut["give-blueprint"])

const createAssemblyShortcut: PRecord<string, any> = {
  ...blueprintShortcut,
  name: Prototypes.CreateAssembly,
  style: "default",
  item_to_spawn: Prototypes.AssemblyCreationTool,
  order: "c[bbpp]-[create-assembly]",
  associated_control_input: Prototypes.CreateAssembly,
}
delete createAssemblyShortcut.technology_to_unlock
delete createAssemblyShortcut.localised_name

data.extend([
  assemblyCreationTool,
  importPreview,
  importPreviewPositionMarker,
  importPreviewPositionItem,
  etherealWhiteTile,
  importPreviewTileItem,
  createAssemblyShortcut,
])
