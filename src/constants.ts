export const enum Settings {
  Autosave = "b2p2:auto-save",
}

export const enum Inputs {
  TeleportToSource = "b2p2:teleport-to-source",
  TeleportForward = "b2p2:teleport-forward",
  TeleportBackward = "b2p2:teleport-backward",
}

export const enum Prototypes {
  AssemblyCreationTool = "b2p2:assembly-creation-tool",
  ImportPreview = "b2p2:import-preview",
  ImportPreviewPositionMarker = "b2p2:import-preview-position-marker",
  ImportPreviewBoundaryTile = "b2p2:import-preview-boundary-tile",
  CreateAssembly = "b2p2:create-assembly",
  OverlappedGhost = "b2p2:overlapped-ghost",
}

export const enum Styles {
  ListBoxButton = "b2p2:listbox-button",
  ScrollPaneFakeListbox = "b2p2:scrollpane-fake-listbox",
  AMListScrollPane = "b2p2:bare-scrollpane",
}

export const enum Sprites {
  TeleportBlack = "b2p2:teleport-black",
  TeleportWhite = "b2p2:teleport-white",
}

export const enum GuiConstants {
  AssembliesListWidth = 400,
  AssembliesListMinHeight = 28 * 4,
  AssembliesListMaxHeight = 28 * 8,

  AssemblyManagerWidth = 500,

  ImportItemHeight = 42,
  AMListMinHeight = ImportItemHeight * 4,
  AMListMaxHeight = ImportItemHeight * 8,

  SaveResetButtonWidth = 60,
  SaveResetButtonHeight = 24,
}

export namespace Colors {
  export const AssemblyOutline: ColorArray = [173, 216, 230, 0.5]
  export const AssemblyOutdated: ColorArray = [1, 1, 0.3, 0.5]
  // white
  export const AssemblyName: ColorArray = [1, 1, 1]
  // light red
  export const AssemblyError: ColorArray = [1, 0.3, 0.3, 0.5]

  // light blue
  export const ImportHighlight: ColorArray = [0.5, 0.6, 1, 0.5]
}
