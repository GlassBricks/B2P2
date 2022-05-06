import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection, Location } from "./diagnostics/Diagnostic"
import { describeEntity, getTileBox, isUnhandledProp, UnhandledProp } from "../entity/entity"
import { assertNever } from "../lib/util"
import { L_Diagnostic } from "../locale"

export type PasteDiagnosticId = "overlap" | "items-ignored" | "cannot-upgrade" | "unsupported-prop"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnosticId>

function makeLocation(worldTopLeft: MapPositionTable, surface: LuaSurface, entity: BlueprintEntityRead): Location {
  return {
    surface,
    worldTopLeft,
    boundingBox: getTileBox(entity),
  }
}
export const Overlap = DiagnosticCategory(
  {
    id: "overlap",
    shortDescription: [L_Diagnostic.Overlap],
    highlightType: "not-allowed",
  },
  (
    below: BlueprintEntityRead,
    above: BlueprintEntityRead,
    surface: LuaSurface,
    relativePosition: MapPositionTable,
  ) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above), describeEntity(below)],
    location: makeLocation(relativePosition, surface, above),
  }),
)
export const CannotUpgrade = DiagnosticCategory(
  {
    id: "cannot-upgrade",
    shortDescription: [L_Diagnostic.CannotUpgrade],
    longDescription: [L_Diagnostic.CannotUpgradeDetail],
    highlightType: "copy",
  },
  (
    below: BlueprintEntityRead,
    above: BlueprintEntityRead,
    surface: LuaSurface,
    relativePosition: MapPositionTable,
  ) => ({
    message: [L_Diagnostic.CannotUpgradeItem, describeEntity(above), describeEntity(below)],
    location: makeLocation(relativePosition, surface, above),
  }),
)
export const ItemsIgnored = DiagnosticCategory(
  {
    id: "items-ignored",
    shortDescription: [L_Diagnostic.ItemsIgnored],
    longDescription: [L_Diagnostic.ItemsIgnoredDetail],
    highlightType: "pair",
  },
  (entity: BlueprintEntityRead, surface: LuaSurface, relativePosition: MapPositionTable) => ({
    message: [L_Diagnostic.ItemsIgnoredItem, describeEntity(entity)],
    location: makeLocation(relativePosition, surface, entity),
  }),
)

export const UnsupportedProp = DiagnosticCategory(
  {
    id: "unsupported-prop",
    shortDescription: [L_Diagnostic.UnsupportedProp],
    highlightType: "not-allowed",
  },
  (entity: BlueprintEntityRead, surface: LuaSurface, relativePosition: MapPositionTable, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedPropItem, describeEntity(entity), property],
    location: makeLocation(relativePosition, surface, entity),
  }),
)

export function mapPasteConflictsToDiagnostics(
  conflicts: BlueprintPasteConflicts,
  surface: LuaSurface,
  worldTopLeft: MapPositionTable,
): PasteDiagnostics {
  const diagnostics: PasteDiagnostics = {}
  if (conflicts.overlaps) {
    for (const { below, above } of conflicts.overlaps) {
      addDiagnostic(diagnostics, Overlap, below, above, surface, worldTopLeft)
    }
  }
  if (conflicts.propConflicts)
    for (const { prop, below, above } of conflicts.propConflicts) {
      if (prop === "name") {
        addDiagnostic(diagnostics, CannotUpgrade, below, above, surface, worldTopLeft)
      } else if (prop === "items") {
        addDiagnostic(diagnostics, ItemsIgnored, above, surface, worldTopLeft)
      } else if (isUnhandledProp(prop)) {
        addDiagnostic(diagnostics, UnsupportedProp, above, surface, worldTopLeft, prop)
      } else {
        assertNever(prop)
      }
    }
  return diagnostics
}
