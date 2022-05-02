export const enum Styles {
  ListBoxButton = "bbpp:listbox-button",
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
  AssembliesListMaxHeight = 400,

  AssemblyManagerWidth = 500,
}

export namespace Colors {
  export const AssemblyOutline: ColorArray = [173, 216, 230, 0.5]
  // white
  export const AssemblyName: ColorArray = [1, 1, 1]

  // light red
  export const AssemblyError: ColorArray = [1, 0.3, 0.3, 0.5]
}
