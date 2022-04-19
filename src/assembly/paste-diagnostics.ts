import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { Diagnostic, DiagnosticFactory } from "../diagnostics/Diagnostic"
import { describeEntity, isUnhandledProp, UnhandledProp } from "../entity/entity"
import { assertNever } from "../lib/util"
import { L_Diagnostic } from "../locale"

export type PasteDiagnostic =
  | L_Diagnostic.Overlap
  | L_Diagnostic.ItemsIgnoredOnPaste
  | L_Diagnostic.CannotUpgrade
  | L_Diagnostic.UnsupportedProp
export type PasteDiagnostics = Diagnostic<PasteDiagnostic>[]
export const Overlap = DiagnosticFactory(
  L_Diagnostic.Overlap,
  "error",
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.Overlap, describeEntity(above), describeEntity(below)],
    location: above.position,
  }),
)
export const CannotUpgrade = DiagnosticFactory(
  L_Diagnostic.CannotUpgrade,
  "error",
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.CannotUpgrade, describeEntity(above), describeEntity(below)],
    location: above.position,
  }),
)
export const ItemsIgnored = DiagnosticFactory(
  L_Diagnostic.ItemsIgnoredOnPaste,
  "warning",
  (entity: BlueprintEntityRead) => ({
    message: [L_Diagnostic.ItemsIgnoredOnPaste, describeEntity(entity)],
    location: entity.position,
  }),
)
export const UnsupportedProp = DiagnosticFactory(
  L_Diagnostic.UnsupportedProp,
  "warning",
  (entity: BlueprintEntityRead, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedProp, describeEntity(entity), property],
    location: entity.position,
  }),
)

export function mapPasteConflictsToDiagnostics(conflicts: BlueprintPasteConflicts): PasteDiagnostics {
  const diagnostics: Diagnostic<PasteDiagnostic>[] = []
  if (conflicts.overlaps)
    for (const { below, above } of conflicts.overlaps) {
      diagnostics.push(Overlap(below, above))
    }
  if (conflicts.propConflicts)
    for (const { prop, below, above } of conflicts.propConflicts) {
      if (prop === "name") {
        diagnostics.push(CannotUpgrade(below, above))
      } else if (prop === "items") {
        diagnostics.push(ItemsIgnored(above))
      } else if (isUnhandledProp(prop)) {
        diagnostics.push(UnsupportedProp(above, prop))
      } else {
        assertNever(prop)
      }
    }
  return diagnostics
}
