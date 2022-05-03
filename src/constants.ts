export const enum Styles {
  ListBoxButton = "bbpp:listbox-button",
  ScrollPaneFakeListbox = "bbpp:scrollpane-fake-listbox",
  BareScrollPane = "bbpp:bare-scrollpane",
}

export const enum Prototypes {
  AssemblyCreationTool = "bbpp:assembly-creation-tool",
  ImportPreview = "bbpp:import-preview",
  ImportPreviewPositionMarker = "bbpp:import-preview-position-marker",
}

export const enum Sprites {
  TeleportBlack = "bbpp:teleport-black",
  TeleportWhite = "bbpp:teleport-white",
}

export const enum GuiConstants {
  AssembliesListWidth = 400,
  AssembliesListMinHeight = 28 * 4,
  AssembliesListMaxHeight = 28 * 8,

  AssemblyManagerWidth = 500,

  ImportItemHeight = 42,
  ImportListMinHeight = ImportItemHeight * 4,
  ImportListMaxHeight = ImportItemHeight * 8,
}

export namespace Colors {
  export const AssemblyOutline: ColorArray = [173, 216, 230, 0.5]
  // white
  export const AssemblyName: ColorArray = [1, 1, 1]

  // light red
  export const AssemblyError: ColorArray = [1, 0.3, 0.3, 0.5]
}
