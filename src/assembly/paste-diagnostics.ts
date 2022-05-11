import { BlueprintPasteConflicts } from "../blueprint/blueprint-paste"
import { describeEntity, Entity, getTileBox, isUnhandledProp } from "../entity/entity"
import { bbox } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import { assertNever } from "../lib/util"
import { L_Diagnostic } from "../locale"
import { AreaIdentification } from "./AreaIdentification"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./diagnostics/Diagnostic"
import { EntitySourceMap, getEntitySourceLocation } from "./EntitySourceMap"
import shift = bbox.shift

export type PasteDiagnosticId = "overlap" | "items-ignored" | "cannot-upgrade" | "unsupported-prop"

export type PasteDiagnostics = DiagnosticCollection<PasteDiagnosticId>

export const Overlap = DiagnosticCategory(
  {
    id: "overlap",
    shortDescription: [L_Diagnostic.Overlap],
    highlightType: "not-allowed",
  },
  (
    below: Entity,
    above: Entity,
    assemblyBelowLocation: AreaIdentification,
    assemblyAboveLocation: AreaIdentification,
    sourceBelowLocation: AreaIdentification | undefined,
    sourceAboveLocation: AreaIdentification | undefined,
  ) => ({
    message: [L_Diagnostic.OverlapItem, describeEntity(above), describeEntity(below)],
    location: assemblyAboveLocation,
    highlightLocation: assemblyBelowLocation,
    altLocation: sourceAboveLocation,
    altHighlightLocation: sourceBelowLocation,
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
    for (const { below, above } of conflicts.overlaps) {
      const aboveAssemblyArea = getAssemblyArea(above)
      const belowAssemblyArea = getAssemblyArea(below)

      const belowSourceArea = getSourceArea(below)

      let aboveSourceArea: AreaIdentification | undefined
      if (belowSourceArea) {
        // relative area of above entity in below source area
        const sourcePos = belowSourceArea.area.left_top
        const belowRelativePos = getTileBox(below).left_top
        const offset = pos.sub(sourcePos, belowRelativePos)
        const relativeAltLocation: BoundingBoxRead = bbox.shift(getTileBox(above), offset)
        aboveSourceArea = {
          surface: belowSourceArea.surface,
          area: relativeAltLocation,
        }
      }

      addDiagnostic(
        diagnostics,
        Overlap,
        below,
        above,
        belowAssemblyArea,
        aboveAssemblyArea,
        belowSourceArea,
        aboveSourceArea,
      )
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
