import { AreaIdentification, highlightArea } from "../area/AreaIdentification"
import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import { BlueprintDiff, computeBlueprintDiff } from "../blueprint/blueprint-diff"
import { BlueprintPasteConflicts, BlueprintPasteOptions, pasteAndFindConflicts } from "../blueprint/blueprint-paste"
import { EntitySourceMap, EntitySourceMapBuilder } from "../blueprint/EntitySourceMap"
import { clearBuildableEntities, takeBlueprintWithIndex } from "../blueprint/world"
import { Classes, funcRef } from "../lib"
import { bbox, BBox } from "../lib/geometry"
import { MutableObservableList, MutableState, observableList, state, State } from "../lib/observable"
import { getDiagnosticHighlightType } from "./diagnostics/Diagnostic"
import { AssemblyImport } from "./imports/AssemblyImport"
import { mapPasteConflictsToDiagnostics, PasteDiagnostics } from "./paste-diagnostics"

/**
 * Manages in-world contents of an assembly.
 */
export interface AssemblyContent extends AreaIdentification {
  readonly ownContents: State<PasteBlueprint>
  readonly ownOptions: LayerOptions

  readonly imports: MutableObservableList<AssemblyImportItem>

  resetInWorld(): void
  readonly pasteDiagnostics: State<readonly LayerDiagnostics[]>

  readonly hasConflicts: State<boolean>

  readonly resultContent: State<Blueprint | undefined> // undefined when invalid
  readonly entitySourceMap: State<EntitySourceMap>

  prepareSave(): BlueprintDiff
  readonly pendingSave: State<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

  commitAndReset(): BlueprintDiff | undefined

  saveAndAddImport(imp: AssemblyImport): AssemblyImportItem

  // isUpToDate(): boolean

  delete(): void
}

export interface LayerOptions {
  readonly allowUpgrades: MutableState<boolean>
}

export interface AssemblyImportItem extends LayerOptions {
  readonly import: AssemblyImport
  readonly active: MutableState<boolean>
}

export interface LayerDiagnostics {
  readonly name: State<LocalisedString> | undefined // undefined indicates own content
  readonly diagnostics: PasteDiagnostics
}

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  readonly ownContents: MutableState<PasteBlueprint>
  readonly ownOptions: LayerOptions = {
    allowUpgrades: state(false),
  }
  readonly imports = observableList<AssemblyImportItem>()
  readonly resultContent: MutableState<Blueprint | undefined>
  readonly entitySourceMap: MutableState<EntitySourceMap>
  private importsContent: Blueprint = Blueprint.of()

  pasteDiagnostics: MutableState<LayerDiagnostics[]> = state([
    {
      name: undefined,
      diagnostics: {},
    },
  ])
  hasConflicts = this.pasteDiagnostics.map(funcRef(DefaultAssemblyContent.hasAnyConflicts))
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  constructor(readonly surface: LuaSurface, readonly area: BBox) {
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
        diagnostics: this.computeAndRenderDiagnostics(
          conflict,
          imp ?? this.ownOptions,
          imp?.import.getRelativeBoundingBox(),
          sourceMap,
        ),
      }
    })

    this.pasteDiagnostics.set(diagnostics)

    this.resultContent.set(Blueprint.take(this.surface, this.area))
  }

  private pasteImport(item: AssemblyImportItem, sourceMap: EntitySourceMapBuilder): BlueprintPasteConflicts {
    if (!item.active.get()) return {}
    const imp = item.import
    const content = imp.content().get()
    if (!content) return {}

    const relativeBBox = imp.getRelativeBoundingBox()
    const absoluteBBox = DefaultAssemblyContent.roundBBoxTo2x2(bbox.shift(relativeBBox, this.area.left_top))
    const sourceArea = imp.getSourceArea()
    return this.pasteContentAndRecordSourceMap(
      content,
      absoluteBBox,
      sourceArea,
      sourceMap,
      DefaultAssemblyContent.getPasteOptions(item),
    )
  }

  private pasteOwnContents(sourceMap: EntitySourceMapBuilder): BlueprintPasteConflicts {
    const ownContents = this.ownContents.get()
    return this.pasteContentAndRecordSourceMap(
      ownContents,
      this.area,
      this,
      sourceMap,
      DefaultAssemblyContent.getPasteOptions(this.ownOptions),
    )
  }

  private pasteContentAndRecordSourceMap(
    content: PasteBlueprint,
    contentBounds: BBox,
    sourceArea: AreaIdentification | undefined,
    sourceMap: EntitySourceMapBuilder,
    pasteOptions: BlueprintPasteOptions,
  ) {
    const [conflicts, entities] = pasteAndFindConflicts(this.surface, this.area, content, contentBounds, pasteOptions)
    if (sourceArea) sourceMap.addAll(entities, sourceArea, contentBounds.left_top)
    return conflicts
  }

  private static roundBBoxTo2x2(box: BBox): BBox {
    return bbox.scale(box, 0.5).roundTile().scale(2)
  }

  private computeAndRenderDiagnostics(
    conflicts: BlueprintPasteConflicts,
    options: LayerOptions,
    relativeBBox: BBox | undefined,
    sourceMap: EntitySourceMap,
  ): PasteDiagnostics {
    const absoluteBBox = relativeBBox ? bbox.shift(relativeBBox, this.area.left_top) : this.area
    const diagnostics = mapPasteConflictsToDiagnostics(
      conflicts,
      DefaultAssemblyContent.getPasteOptions(options),
      this.surface,
      absoluteBBox.left_top,
      sourceMap,
    )
    DefaultAssemblyContent.renderDiagnosticHighlights(diagnostics)
    return diagnostics
  }

  private static getPasteOptions(options: LayerOptions): BlueprintPasteOptions {
    return {
      allowUpgrades: options.allowUpgrades.get(),
    }
  }

  private static renderDiagnosticHighlights(collection: PasteDiagnostics): void {
    for (const [, diagnostics] of pairs(collection)) {
      for (const diagnostic of diagnostics) {
        highlightArea(diagnostic.location, getDiagnosticHighlightType(diagnostic.id))
      }
    }
  }

  private static hasAnyConflicts(this: void, conflicts: readonly LayerDiagnostics[]): boolean {
    return conflicts.some((conflict) => {
      for (const [, d] of pairs(conflict.diagnostics)) {
        if (!d.highlightOnly) return true
      }
      return false
    })
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

  saveAndAddImport(imp: AssemblyImport): AssemblyImportItem {
    this.prepareSave()
    const item: AssemblyImportItem = {
      active: state(true),
      import: imp,
      allowUpgrades: state(false),
    }
    this.imports.push(item)
    this.commitAndReset()
    return item
  }

  delete(): void {
    this.resultContent.set(undefined)
    this.entitySourceMap.set(undefined!)
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BBox): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
