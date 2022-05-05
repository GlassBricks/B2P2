import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./diagnostics/Diagnostic"
import { describeEntity, getTileBox, isUnhandledProp, UnhandledProp } from "../entity/entity"
import { assertNever } from "../lib/util"
import { L_Diagnostic } from "../locale"

export type PasteDiagnostic = "overlap" | "items-ignored" | "cannot-upgrade" | "unsupported-prop"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnostic>

export const Overlap = DiagnosticCategory(
  "overlap",
  [L_Diagnostic.Overlap],
  undefined,
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above), describeEntity(below)],
    location: getTileBox(above),
  }),
)
export const CannotUpgrade = DiagnosticCategory(
  "cannot-upgrade",
  [L_Diagnostic.CannotUpgrade],
  [L_Diagnostic.CannotUpgradeDetail],
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.CannotUpgradeItem, describeEntity(above), describeEntity(below)],
    location: getTileBox(above),
  }),
)
export const ItemsIgnored = DiagnosticCategory(
  "items-ignored",
  [L_Diagnostic.ItemsIgnored],
  [L_Diagnostic.ItemsIgnoredDetail],
  (entity: BlueprintEntityRead) => ({
    message: [L_Diagnostic.ItemsIgnoredItem, describeEntity(entity)],
    location: getTileBox(entity),
  }),
)
export const UnsupportedProp = DiagnosticCategory(
  "unsupported-prop",
  [L_Diagnostic.UnsupportedProp],
  undefined,
  (entity: BlueprintEntityRead, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedPropItem, describeEntity(entity), property],
    location: getTileBox(entity),
  }),
)

export function mapPasteConflictsToDiagnostics(conflicts: BlueprintPasteConflicts): PasteDiagnostics {
  const diagnostics: PasteDiagnostics = {}
  if (conflicts.overlaps) {
    for (const { below, above } of conflicts.overlaps) {
      addDiagnostic(diagnostics, Overlap, below, above)
    }
  }
  if (conflicts.propConflicts)
    for (const { prop, below, above } of conflicts.propConflicts) {
      if (prop === "name") {
        addDiagnostic(diagnostics, CannotUpgrade, below, above)
      } else if (prop === "items") {
        addDiagnostic(diagnostics, ItemsIgnored, above)
      } else if (isUnhandledProp(prop)) {
        addDiagnostic(diagnostics, UnsupportedProp, above, prop)
      } else {
        assertNever(prop)
      }
    }
  return diagnostics
}
