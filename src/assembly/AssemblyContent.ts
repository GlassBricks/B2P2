import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
} from "../blueprint/blueprint-paste"
import { Classes, funcRef } from "../lib"
import { pos } from "../lib/geometry/position"
import { MutableObservableList, MutableState, observableList, state, State } from "../lib/observable"
import { isEmpty } from "../lib/util"
import { clearBuildableEntities, pasteBlueprint, takeBlueprintWithIndex } from "../world-interaction/blueprint"
import { AreaIdentification } from "./AreaIdentification"
import { createHighlight, getDiagnosticHighlightType } from "./diagnostics/Diagnostic"
import { EntitySourceMap, EntitySourceMapBuilder } from "./EntitySourceMap"
import { AssemblyImport } from "./imports/AssemblyImport"
import { mapPasteConflictsToDiagnostics, PasteDiagnostics } from "./paste-diagnostics"

/**
 * Manages in-world contents of an assembly.
 */
export interface AssemblyContent extends AreaIdentification {
  readonly ownContents: State<PasteBlueprint>

  readonly imports: MutableObservableList<AssemblyImportItem>

  resetInWorld(): void
  readonly pasteDiagnostics: State<readonly LayerPasteDiagnostics[]>

  hasConflicts: State<boolean>

  readonly resultContent: State<Blueprint | undefined> // undefined when invalid
  readonly entitySourceMap: State<EntitySourceMap | undefined>

  prepareSave(): BlueprintDiff
  readonly pendingSave: State<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

  commitAndReset(): BlueprintDiff | undefined

  saveAndAddImport(imp: AssemblyImport): void

  // isUpToDate(): boolean
  // above is false when imports have changed

  delete(): void
}

export interface AssemblyImportItem {
  readonly import: AssemblyImport
  readonly active: MutableState<boolean>
}

export interface LayerPasteDiagnostics {
  readonly name: State<LocalisedString> | undefined
  readonly diagnostics: PasteDiagnostics
}

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  ownContents: MutableState<PasteBlueprint>
  readonly imports = observableList<AssemblyImportItem>()
  readonly resultContent: MutableState<Blueprint | undefined>
  readonly entitySourceMap: MutableState<EntitySourceMap | undefined>
  private importsContent: Blueprint = Blueprint.of()

  pasteDiagnostics: MutableState<LayerPasteDiagnostics[]> = state([
    {
      name: undefined,
      diagnostics: {},
    },
  ])
  hasConflicts = this.pasteDiagnostics.map(funcRef(DefaultAssemblyContent.hasAnyConflicts))
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  constructor(readonly surface: LuaSurface, readonly area: BoundingBoxRead) {
    const [entities, index] = takeBlueprintWithIndex(surface, area)
    const content = Blueprint._new(entities)
    this.ownContents = state(content)
    this.resultContent = state(content)
    const luaEntities = Object.values(index)
    this.entitySourceMap = state(new EntitySourceMapBuilder().addAll(luaEntities, this, this.area.left_top).build())
  }

  resetInWorld(): void {
    clearBuildableEntities(this.surface, this.area)

    const bpConflicts: BlueprintPasteConflicts[] = []
    const sourceMapBuilder = new EntitySourceMapBuilder()

    const assemblyImports = this.imports.value()
    for (const imp of assemblyImports) {
      bpConflicts.push(this.pasteImport(imp, sourceMapBuilder))
    }

    this.importsContent = Blueprint.take(this.surface, this.area)
    bpConflicts.push(this.pasteOwnContents(this.importsContent, sourceMapBuilder))

    const sourceMap = sourceMapBuilder.build()
    this.entitySourceMap.set(sourceMap)

    const diagnostics = bpConflicts.map((conflict, index) => {
      const imp = assemblyImports[index]
      return {
        name: imp?.import.name(),
        diagnostics: this.computeAndRenderDiagnostics(conflict, imp?.import.getRelativePosition(), sourceMap),
      }
    })

    this.pasteDiagnostics.set(diagnostics)

    this.resultContent.set(Blueprint.take(this.surface, this.area))
  }

  private pasteImport(
    { active, import: imp }: AssemblyImportItem,
    sourceMap: EntitySourceMapBuilder,
  ): BlueprintPasteConflicts {
    if (!active.get()) return {}
    const content = imp.content().get()
    if (!content) return {}

    const relativePosition = imp.getRelativePosition()

    const topLeft = this.getAbsolutePosition(relativePosition)
    this.pasteBlueprintWithSourceMap(content, topLeft, sourceMap, imp.getSourceArea())

    return findBlueprintPasteConflictsInWorld(this.surface, this.area, content, relativePosition)
  }

  private pasteOwnContents(importsContent: Blueprint, sourceMap: EntitySourceMapBuilder): BlueprintPasteConflicts {
    const ownContents = this.ownContents.get()

    const topLeft = this.area.left_top
    this.pasteBlueprintWithSourceMap(ownContents, topLeft, sourceMap, this)

    return findBlueprintPasteConflictsAndUpdate(importsContent, ownContents)
  }

  private pasteBlueprintWithSourceMap(
    content: PasteBlueprint,
    absolutePosition: MapPositionTable,
    map: EntitySourceMapBuilder,
    sourceArea: AreaIdentification | undefined,
  ): void {
    const entities = this.pasteBlueprint(content, absolutePosition)
    if (sourceArea) map.addAll(entities, sourceArea, absolutePosition)
  }

  private pasteBlueprint(content: PasteBlueprint, absolutePosition: MapPositionTable): LuaEntity[] {
    return pasteBlueprint(this.surface, absolutePosition, content.entities, this.area)
  }

  private getAbsolutePosition(relativePosition: MapPositionTable | undefined): MapPositionTable {
    const leftTop = this.area.left_top
    return relativePosition ? pos.add(leftTop, relativePosition) : leftTop
  }

  private computeAndRenderDiagnostics(
    conflicts: BlueprintPasteConflicts,
    relativeLeftTop: MapPositionTable | undefined,
    sourceMap: EntitySourceMap,
  ): PasteDiagnostics {
    const absoluteLeftTop = this.getAbsolutePosition(relativeLeftTop)
    const diagnostics = mapPasteConflictsToDiagnostics(conflicts, this.surface, absoluteLeftTop, sourceMap)
    DefaultAssemblyContent.renderDiagnosticHighlights(diagnostics)
    return diagnostics
  }

  private static renderDiagnosticHighlights(collection: PasteDiagnostics): void {
    for (const [, diagnostics] of pairs(collection)) {
      for (const diagnostic of diagnostics) {
        createHighlight(diagnostic.location, getDiagnosticHighlightType(diagnostic.id), {})
      }
    }
  }

  private static hasAnyConflicts(this: void, conflicts: readonly LayerPasteDiagnostics[]): boolean {
    return conflicts.some((conflict) => !isEmpty(conflict.diagnostics))
  }

  prepareSave(): BlueprintDiff {
    const diff = computeBlueprintDiff(this.importsContent, Blueprint.take(this.surface, this.area))
    this.pendingSave.set(diff)
    return diff
  }

  commitSave(): BlueprintDiff | undefined {
    const diff = this.pendingSave.get()
    if (diff) {
      this.pendingSave.set(undefined)
      this.ownContents.set(diff.content)
    }
    return diff
  }

  commitAndReset(): BlueprintDiff | undefined {
    const diff = this.commitSave()
    if (diff) {
      this.resetInWorld()
    }
    return diff
  }

  saveAndAddImport(imp: AssemblyImport): void {
    this.prepareSave()
    this.imports.push({
      active: state(true),
      import: imp,
    })
    this.commitAndReset()
  }

  delete(): void {
    this.resultContent.set(undefined)
    this.entitySourceMap.set(undefined)
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BoundingBoxRead): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
