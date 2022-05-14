import { AreaIdentification, highlightArea } from "../area/AreaIdentification"
import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import { BlueprintDiff, computeBlueprintDiff } from "../blueprint/blueprint-diff"
import { BlueprintPasteConflicts, pasteAndFindConflicts } from "../blueprint/blueprint-paste"
import { EntitySourceMap, EntitySourceMapBuilder } from "../blueprint/EntitySourceMap"
import { clearBuildableEntities, takeBlueprintWithIndex } from "../blueprint/world"
import { Classes, funcRef } from "../lib"
import { pos } from "../lib/geometry/position"
import { MutableObservableList, MutableState, observableList, state, State } from "../lib/observable"
import { isEmpty } from "../lib/util"
import { getDiagnosticHighlightType } from "./diagnostics/Diagnostic"
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
  readonly entitySourceMap: State<EntitySourceMap>

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
  readonly entitySourceMap: MutableState<EntitySourceMap>
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
    bpConflicts.push(this.pasteOwnContents(sourceMapBuilder))

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
    const sourceArea = imp.getSourceArea()
    return this.pasteContentAndRecordSourceMap(content, relativePosition, sourceArea, sourceMap)
  }

  private pasteOwnContents(sourceMap: EntitySourceMapBuilder): BlueprintPasteConflicts {
    const ownContents = this.ownContents.get()
    return this.pasteContentAndRecordSourceMap(ownContents, undefined, this, sourceMap)
  }
  private pasteContentAndRecordSourceMap(
    content: PasteBlueprint,
    relativePosition: MapPositionTable | undefined,
    sourceArea: AreaIdentification | undefined,
    sourceMap: EntitySourceMapBuilder,
  ) {
    const topLeft = this.getAbsolutePosition(relativePosition)
    const [conflicts, entities] = pasteAndFindConflicts(this.surface, this.area, content, topLeft)
    if (sourceArea) sourceMap.addAll(entities, sourceArea, topLeft)
    return conflicts
  }

  private getAbsolutePosition(relativePosition: MapPositionTable | undefined): MapPositionTable {
    const leftTop = this.area.left_top
    return relativePosition ? pos.add(leftTop, pos.div(relativePosition, 2).floor().times(2)) : leftTop
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
        highlightArea(diagnostic.location, getDiagnosticHighlightType(diagnostic.id))
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
    this.entitySourceMap.set(undefined!)
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BoundingBoxRead): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
