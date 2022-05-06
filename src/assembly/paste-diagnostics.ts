import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./diagnostics/Diagnostic"
import { describeEntity, isUnhandledProp, UnhandledProp } from "../entity/entity"
import { assertNever } from "../lib/util"
import { L_Diagnostic } from "../locale"

export type PasteDiagnosticId = "overlap" | "items-ignored" | "cannot-upgrade" | "unsupported-prop"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnosticId>

export const Overlap = DiagnosticCategory(
  {
    id: "overlap",
    shortDescription: [L_Diagnostic.Overlap],
    highlightType: "not-allowed",
  },
  (below: BlueprintEntityRead, above: BlueprintEntityRead, relativePosition: MapPositionTable) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above), describeEntity(below)],
    entity: above,
    relativePosition,
  }),
)
export const CannotUpgrade = DiagnosticCategory(
  {
    id: "cannot-upgrade",
    shortDescription: [L_Diagnostic.CannotUpgrade],
    longDescription: [L_Diagnostic.CannotUpgradeDetail],
    highlightType: "copy",
  },
  (below: BlueprintEntityRead, above: BlueprintEntityRead, relativePosition: MapPositionTable) => ({
    message: [L_Diagnostic.CannotUpgradeItem, describeEntity(above), describeEntity(below)],
    entity: above,
    relativePosition,
  }),
)
export const ItemsIgnored = DiagnosticCategory(
  {
    id: "items-ignored",
    shortDescription: [L_Diagnostic.ItemsIgnored],
    longDescription: [L_Diagnostic.ItemsIgnoredDetail],
    highlightType: "pair",
  },
  (entity: BlueprintEntityRead, relativePosition: MapPositionTable) => ({
    message: [L_Diagnostic.ItemsIgnoredItem, describeEntity(entity)],
    entity,
    relativePosition,
  }),
)
export const UnsupportedProp = DiagnosticCategory(
  {
    id: "unsupported-prop",
    shortDescription: [L_Diagnostic.UnsupportedProp],
    highlightType: "not-allowed",
  },
  (entity: BlueprintEntityRead, relativePosition: MapPositionTable, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedPropItem, describeEntity(entity), property],
    entity,
    relativePosition,
  }),
)

export function mapPasteConflictsToDiagnostics(
  conflicts: BlueprintPasteConflicts,
  relativePosition: MapPositionTable,
): PasteDiagnostics {
  const diagnostics: PasteDiagnostics = {}
  if (conflicts.overlaps) {
    for (const { below, above } of conflicts.overlaps) {
      addDiagnostic(diagnostics, Overlap, below, above, relativePosition)
    }
  }
  if (conflicts.propConflicts)
    for (const { prop, below, above } of conflicts.propConflicts) {
      if (prop === "name") {
        addDiagnostic(diagnostics, CannotUpgrade, below, above, relativePosition)
      } else if (prop === "items") {
        addDiagnostic(diagnostics, ItemsIgnored, above, relativePosition)
      } else if (isUnhandledProp(prop)) {
        addDiagnostic(diagnostics, UnsupportedProp, above, relativePosition, prop)
      } else {
        assertNever(prop)
      }
    }
  return diagnostics
}
