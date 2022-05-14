import { AreaIdentification } from "../area/AreaIdentification"
import { BlueprintPasteConflicts, BlueprintPasteOptions } from "../blueprint/blueprint-paste"
import { EntitySourceMap, getEntitySourceLocation } from "../blueprint/EntitySourceMap"
import { describeEntity, Entity, getTileBox } from "../entity/entity"
import { bbox, Position } from "../lib/geometry"
import { L_Diagnostic } from "../locale"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./diagnostics/Diagnostic"
import shift = bbox.shift

export type PasteDiagnosticId = "overlap" | "items-ignored" | "cannot-upgrade" | "unsupported-prop"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnosticId>

export const Overlap = DiagnosticCategory(
  {
    id: "overlap",
    shortDescription: [L_Diagnostic.Overlap],
    highlightType: "not-allowed",
  },
  (above: Entity, assemblyAboveLocation: AreaIdentification) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above)],
    location: assemblyAboveLocation,
  }),
)
export const CannotUpgrade = DiagnosticCategory(
  {
    id: "cannot-upgrade",
    shortDescription: [L_Diagnostic.CannotUpgrade],
    longDescription: [L_Diagnostic.CannotUpgradeTooltip],
    highlightType: "copy",
  },
  (
    below: Entity,
    sourceLocation: AreaIdentification | undefined,
    above: Entity,
    assemblyLocation: AreaIdentification | undefined,
  ) => ({
    message: [L_Diagnostic.CannotUpgradeItem, describeEntity(above), describeEntity(below)],
    location: assemblyLocation,
    altLocation: sourceLocation,
  }),
)
export const ItemsIgnored = DiagnosticCategory(
  {
    id: "items-ignored",
    shortDescription: [L_Diagnostic.ItemsIgnored],
    longDescription: [L_Diagnostic.ItemsIgnoredTooltip],
    highlightType: "pair",
  },
  (
    below: Entity,
    sourceLocation: AreaIdentification | undefined,
    above: Entity,
    assemblyLocation: AreaIdentification,
  ) => ({
    message: [L_Diagnostic.ItemsIgnoredItem, describeEntity(above)],
    location: assemblyLocation,
    altLocation: sourceLocation,
  }),
)

export function mapPasteConflictsToDiagnostics(
  conflicts: BlueprintPasteConflicts,
  options: BlueprintPasteOptions,
  surface: LuaSurface,
  pastedLeftTop: Position,
  sourceMap: EntitySourceMap,
): PasteDiagnostics {
  const diagnostics: PasteDiagnostics = {}

  function getSourceArea(entity: Entity): AreaIdentification | undefined {
    return getEntitySourceLocation(sourceMap, entity, pastedLeftTop)
  }
  function getAssemblyArea(entity: Entity): AreaIdentification {
    return {
      surface,
      area: shift(getTileBox(entity), pastedLeftTop),
    }
  }

  if (conflicts.overlaps) {
    for (const above of conflicts.overlaps) {
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, Overlap, above, aboveArea)
    }
  }
  if (conflicts.upgrades) {
    for (const { below, above } of conflicts.upgrades) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, CannotUpgrade, below, belowArea, above, aboveArea)
    }
    if (options.allowUpgrades) {
      if (diagnostics["cannot-upgrade"]) {
        diagnostics["cannot-upgrade"].highlightOnly = true
      }
    }
  }
  if (conflicts.itemRequestChanges) {
    for (const { below, above } of conflicts.itemRequestChanges) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, ItemsIgnored, below, belowArea, above, aboveArea)
    }
  }
  return diagnostics
}
