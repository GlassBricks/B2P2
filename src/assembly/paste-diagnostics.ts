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
    message: [L_Diagnostic.OverlapItem, describeEntity(above)],
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
    title: [L_Diagnostic.ItemsIgnored],
    tooltip: [L_Diagnostic.ItemsIgnoredTooltip],
    highlightType: "pair",
  },
  (
    below: FullEntity,
    sourceLocation: AreaIdentification | undefined,
    above: FullEntity,
    assemblyLocation: AreaIdentification,
  ) => ({
    message: [
      L_Diagnostic.ItemsIgnoredItem,
      describeEntity(above),
      describeItems(below.items),
      describeItems(above.items),
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
    message: [L_Diagnostic.FlippedUndergroundItem, describeEntity(entity)],
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
    for (const { below, above } of conflicts.upgrades) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      addDiagnostic(diagnostics, CannotUpgrade, below, belowArea, above, aboveArea)
    }
    if (options?.allowUpgrades.get()) {
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
  if (conflicts.flippedUndergrounds) {
    for (const entity of conflicts.flippedUndergrounds) {
      addDiagnostic(diagnostics, FlippedUnderground, entity, getAssemblyArea(entity))
    }
  }
  return diagnostics
}
