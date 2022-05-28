import { AreaIdentification, highlightArea } from "../area/AreaIdentification"
import { Blueprint, createEntityPositionMap } from "../blueprint/Blueprint"
import { BlueprintDiff, computeBlueprintDiff } from "../blueprint/blueprint-diff"
import { BlueprintPasteConflicts, PartialBlueprint, pasteAndFindConflicts } from "../blueprint/blueprint-paste"
import { EntitySourceMap, EntitySourceMapBuilder, SourceMapEntity } from "../blueprint/EntitySourceMap"
import { ItemBlueprint } from "../blueprint/ItemBlueprint"
import { LuaBlueprint, PasteBlueprint } from "../blueprint/LuaBlueprint"
import { clearBuildableEntities } from "../blueprint/world"
import { FullEntity } from "../entity/entity"
import { bound, Callback, Classes, funcRef, getAllInstances, rebindFuncs, reg } from "../lib"
import { bbox, BBox } from "../lib/geometry"
import { Migrations } from "../lib/migration"
import { MutableObservableList, MutableState, observableList, observeEachUnique, state, State } from "../lib/observable"
import { dependencyNode, DependencyNode } from "../lib/observable/DependencyNode"
import { getDiagnosticHighlightType } from "./diagnostics/Diagnostic"
import { AssemblyImport } from "./imports/AssemblyImport"
import { LayerOptions } from "./LayerOptions"
import { mapPasteConflictsToDiagnostics, PasteDiagnostics } from "./paste-diagnostics"

/**
 * Manages in-world contents of an assembly.
 */
export interface AssemblyContent extends AreaIdentification {
  readonly ownContents: PasteBlueprint | undefined
  readonly ownOptions: LayerOptions

  readonly imports: MutableObservableList<AssemblyImportItem>

  resetInWorld(): void
  readonly pasteDiagnostics: State<readonly LayerDiagnostics[]>

  readonly hasConflicts: State<boolean>

  readonly resultContent: Blueprint<FullEntity> | undefined // undefined when invalid
  readonly entitySourceMap: EntitySourceMap

  prepareSave(): BlueprintDiff
  readonly pendingSave: State<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

  commitAndReset(): BlueprintDiff | undefined
  saveAndAddImport(imp: AssemblyImport): AssemblyImportItem

  readonly dependencyNode: DependencyNode

  delete(): void
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
  // these set to undefined when invalid
  ownContents: PasteBlueprint | undefined
  resultContent: ItemBlueprint | undefined
  importsContent: ItemBlueprint | undefined

  readonly ownOptions: LayerOptions = {
    allowUpgrades: state(false),
  }
  readonly imports = observableList<AssemblyImportItem>()
  entitySourceMap: EntitySourceMap

  pasteDiagnostics: MutableState<LayerDiagnostics[]> = state([
    {
      name: undefined,
      diagnostics: {},
    },
  ])
  hasConflicts = this.pasteDiagnostics.map(funcRef(DefaultAssemblyContent.hasAnyConflicts))
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  dependencyNode: DependencyNode
  private callbacks: Callback[] | undefined

  constructor(readonly surface: LuaSurface, readonly area: BBox) {
    const [content, index] = ItemBlueprint.newWithIndex(surface, area)
    // const [content, index] = takeBlueprintWithIndex(surface, area)
    this.ownContents = LuaBlueprint._new(content.getEntities())
    this.resultContent = content
    this.importsContent = ItemBlueprint.empty()
    this.entitySourceMap = new EntitySourceMapBuilder().addAll(index, this, this.area.left_top).build()

    this.dependencyNode = dependencyNode(reg(this.doResetInWorld))
    this.dependencyNode.ensureUpToDate()
    this.addSubscriptions()
  }

  addSubscriptions(): void {
    this.callbacks = [observeEachUnique(this.imports, reg(this.onImportsChanged), true)]
  }

  @bound
  private onImportsChanged(
    imp: AssemblyImportItem,
    _: number,
    type: "add" | "swap" | "remove",
  ): Callback[] | undefined {
    if (type === "add") {
      const impNode = imp.import.getDependencyNode()
      if (impNode) this.dependencyNode.addDependency(impNode)
      const cb = imp.active.subscribe(reg(this.dependencyNode.markNotUpToDate))
      return [cb]
    }
    if (type === "remove") {
      const impNode = imp.import.getDependencyNode()
      if (impNode) this.dependencyNode.removeDependency(impNode)
      return undefined
    }
    assert(type === "swap")
    // do nothing for swap
  }

  @bound
  doResetInWorld(): void {
    if (!this.ownContents) return // invalid
    clearBuildableEntities(this.surface, this.area)

    const bpConflicts: BlueprintPasteConflicts[] = []

    const sourceMapBuilder = new EntitySourceMapBuilder()
    const belowContent = new PartialBlueprint()

    const assemblyImports = this.imports.value()
    for (const imp of assemblyImports) {
      bpConflicts.push(this.pasteImport(imp, belowContent, sourceMapBuilder))
    }

    this.importsContent!.retake(this.surface, this.area)
    bpConflicts.push(this.pasteOwnContents(belowContent, sourceMapBuilder))

    this.resultContent!.retake(this.surface, this.area)

    const sourceMap = sourceMapBuilder.build()
    this.entitySourceMap = sourceMap

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
  }

  resetInWorld(): void {
    this.dependencyNode.resetSelf()
  }

  private pasteImport(
    item: AssemblyImportItem,
    belowContent: PartialBlueprint,
    sourceMap: EntitySourceMapBuilder,
  ): BlueprintPasteConflicts {
    if (!item.active.get()) return {}
    const imp = item.import
    const content = imp.getContent()
    if (!content) return {}

    const relativeBBox = imp.getRelativeBoundingBox()
    const absoluteBBox = DefaultAssemblyContent.roundBBoxTo2x2(bbox.shift(relativeBBox, this.area.left_top))

    const sourceArea = imp.getSourceArea()
    return this.pasteContentAndRecordSourceMap(content, absoluteBBox, belowContent, sourceArea, sourceMap)
  }

  private pasteOwnContents(belowContent: PartialBlueprint, sourceMap: EntitySourceMapBuilder): BlueprintPasteConflicts {
    return this.pasteContentAndRecordSourceMap(this.ownContents!, this.area, belowContent, this, sourceMap)
  }

  private pasteContentAndRecordSourceMap(
    content: PasteBlueprint,
    contentBounds: BBox,
    belowContent: PartialBlueprint,
    sourceArea: AreaIdentification | undefined,
    sourceMap: EntitySourceMapBuilder,
  ) {
    const [conflicts, entities] = pasteAndFindConflicts(this, belowContent, content, contentBounds)
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
      options,
      this.surface,
      absoluteBBox.left_top,
      sourceMap,
    )
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

  private static hasAnyConflicts(this: void, conflicts: readonly LayerDiagnostics[]): boolean {
    return conflicts.some((conflict) => {
      for (const [, d] of pairs(conflict.diagnostics)) {
        if (!d.highlightOnly) return true
      }
      return false
    })
  }

  prepareSave(): BlueprintDiff {
    if (!this.importsContent) return { content: LuaBlueprint.of() }
    const diff = computeBlueprintDiff(this.importsContent, LuaBlueprint.take(this.surface, this.area, undefined))
    this.pendingSave.set(diff)
    return diff
  }

  commitSave(): BlueprintDiff | undefined {
    const diff = this.pendingSave.get()
    if (diff) {
      this.pendingSave.set(undefined)
      this.ownContents = diff.content
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
    this.resultContent?.delete()
    this.importsContent?.delete()
    this.dependencyNode.delete()
    if (this.callbacks) for (const cb of this.callbacks) cb()
    this.callbacks = undefined

    this.resultContent = undefined
    this.ownContents = undefined
    this.importsContent = undefined
  }
}

Migrations.from("0.3.0", () => {
  interface OldDefaultAssemblyContent {
    entitySourceMap: MutableState<Blueprint<SourceMapEntity>>
    ownContents: MutableState<PasteBlueprint | undefined>
    resultContent: MutableState<LuaBlueprint<FullEntity> | undefined>
    importsContent: LuaBlueprint<FullEntity>
  }
  for (const instance of getAllInstances(DefaultAssemblyContent)) {
    const old = instance as unknown as OldDefaultAssemblyContent

    instance.entitySourceMap = createEntityPositionMap(old.entitySourceMap.value.getEntities())

    instance.ownContents = old.ownContents.value

    const oldResultContent = old.resultContent.value
    instance.resultContent = oldResultContent && ItemBlueprint.from(oldResultContent)

    const importsContent = old.importsContent
    instance.importsContent = importsContent && ItemBlueprint.from(importsContent)
  }
})

Migrations.from("0.4.0", () => {
  const instances = rebindFuncs(DefaultAssemblyContent)
  for (const instance of instances) {
    instance.dependencyNode = dependencyNode(reg(instance.doResetInWorld))
    instance.addSubscriptions()
  }
})

export function createAssemblyContent(surface: LuaSurface, area: BBox): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
