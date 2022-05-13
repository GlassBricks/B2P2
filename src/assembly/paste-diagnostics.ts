import { AreaIdentification } from "../blueprint/AreaIdentification"
import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { EntitySourceMap, getEntitySourceLocation } from "../blueprint/EntitySourceMap"
import { describeEntity, Entity, getTileBox, isUnhandledProp } from "../entity/entity"
import { bbox } from "../lib/geometry/bounding-box"
import { assertNever } from "../lib/util"
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
    longDescription: [L_Diagnostic.CannotUpgradeDetail],
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
    longDescription: [L_Diagnostic.ItemsIgnoredDetail],
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

export const UnsupportedProp = DiagnosticCategory(
  {
    id: "unsupported-prop",
    shortDescription: [L_Diagnostic.UnsupportedProp],
    longDescription: [L_Diagnostic.UnsupportedPropDetail],
    highlightType: "not-allowed",
  },
  (
    below: Entity,
    sourceLocation: AreaIdentification | undefined,
    above: Entity,
    assemblyLocation: AreaIdentification,
    prop: string,
  ) => ({
    message: [L_Diagnostic.UnsupportedPropItem, describeEntity(above), prop],
    location: assemblyLocation,
    altLocation: sourceLocation,
  }),
)

export function mapPasteConflictsToDiagnostics(
  conflicts: BlueprintPasteConflicts,
  surface: LuaSurface,
  pastedLeftTop: MapPositionTable,
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
  if (conflicts.propConflicts)
    for (const { prop, below, above } of conflicts.propConflicts) {
      const belowArea = getSourceArea(below)
      const aboveArea = getAssemblyArea(above)
      if (prop === "name") {
        addDiagnostic(diagnostics, CannotUpgrade, below, belowArea, above, aboveArea)
      } else if (prop === "items") {
        addDiagnostic(diagnostics, ItemsIgnored, below, belowArea, above, aboveArea)
      } else if (isUnhandledProp(prop)) {
        addDiagnostic(diagnostics, UnsupportedProp, below, belowArea, above, aboveArea, prop)
      } else {
        assertNever(prop)
      }
    }
  return diagnostics
}
