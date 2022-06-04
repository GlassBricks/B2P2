import { AreaIdentification } from "../area/AreaIdentification"
import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { EntitySourceMap, getEntitySourceLocation } from "../blueprint/EntitySourceMap"
import { describeEntity, describeItems } from "../entity/describe-entity"
import { Entity, FullEntity } from "../entity/entity"
import { computeTileBox } from "../entity/entity-info"
import { bbox, Position } from "../lib/geometry"
import { L_Diagnostic } from "../locale"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./diagnostics/Diagnostic"
import { LayerOptions } from "./LayerOptions"
import shift = bbox.shift

export type PasteDiagnosticId = "overlap" | "items-ignored" | "cannot-upgrade" | "flipped-underground"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnosticId>

export const Overlap = DiagnosticCategory(
  {
    id: "overlap",
    title: [L_Diagnostic.Overlap],
    highlightType: "not-allowed",
  },
  (above: Entity, assemblyAboveLocation: AreaIdentification) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above.name)],
    location: assemblyAboveLocation,
  }),
)
export const CannotUpgrade = DiagnosticCategory(
  {
    id: "cannot-upgrade",
    title: [L_Diagnostic.CannotUpgrade],
    tooltip: [L_Diagnostic.CannotUpgradeTooltip],
    highlightType: "copy",
  },
  (
    belowName: string,
    sourceLocation: AreaIdentification | undefined,
    aboveName: string,
    assemblyLocation: AreaIdentification | undefined,
  ) => ({
    message: [L_Diagnostic.CannotUpgradeItem, describeEntity(aboveName), describeEntity(belowName)],
    location: assemblyLocation,
    altLocation: sourceLocation,
  }),
)
export const ItemsIgnored = DiagnosticCategory(
  {
    id: "items-ignored",
    title: [L_Diagnostic.ItemsIgnored],
    tooltip: [L_Diagnostic.ItemsIgnoredTooltip],
    highlightType: "pair",
  },
  (
    belowItems: Record<string, number> | undefined,
    sourceLocation: AreaIdentification | undefined,
    aboveName: string,
    aboveItems: Record<string, number> | undefined,
    assemblyLocation: AreaIdentification,
  ) => ({
    message: [
      L_Diagnostic.ItemsIgnoredItem,
      describeEntity(aboveName),
      describeItems(belowItems),
      describeItems(aboveItems),
    ],
    location: assemblyLocation,
    altLocation: sourceLocation,
  }),
)

export const FlippedUnderground = DiagnosticCategory(
  {
    id: "flipped-underground",
    title: [L_Diagnostic.FlippedUnderground],
    tooltip: [L_Diagnostic.FlippedUndergroundTooltip],
    highlightType: "not-allowed",
  },
  (entity: FullEntity, sourceLocation: AreaIdentification | undefined) => ({
    message: [L_Diagnostic.FlippedUndergroundItem, describeEntity(entity.name)],
    location: sourceLocation,
  }),
)

export function mapPasteConflictsToDiagnostics(
  conflicts: BlueprintPasteConflicts,
  options: LayerOptions | undefined,
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
      area: shift(computeTileBox(entity), pastedLeftTop),
    }
  }

  if (conflicts.overlaps) {
    for (const above of conflicts.overlaps) {
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, Overlap, above, aboveArea)
    }
  }
  if (conflicts.upgrades) {
    for (const { below, above, fromValue, toValue } of conflicts.upgrades) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, CannotUpgrade, fromValue, belowArea, toValue, aboveArea)
    }
    if (options?.allowUpgrades.get()) {
      if (diagnostics["cannot-upgrade"]) {
        diagnostics["cannot-upgrade"].highlightOnly = true
      }
    }
  }
  if (conflicts.itemRequestChanges) {
    for (const { below, above, fromValue, toValue } of conflicts.itemRequestChanges) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, ItemsIgnored, fromValue, belowArea, above.name, toValue, aboveArea)
    }
  }
  if (conflicts.flippedUndergrounds) {
    for (const entity of conflicts.flippedUndergrounds) {
      addDiagnostic(diagnostics, FlippedUnderground, entity, getAssemblyArea(entity))
    }
  }
  return diagnostics
}
