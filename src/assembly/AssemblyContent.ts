import { Classes, funcRef } from "../lib"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
} from "../blueprint/blueprint-paste"
import { AssemblyImport } from "./imports/AssemblyImport"
import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { MutableObservableList, observableList } from "../lib/observable/ObservableList"
import { pos } from "../lib/geometry/position"
import { MutableState, state, State } from "../lib/observable"
import { isEmpty } from "../lib/util"
import { mapPasteConflictsToDiagnostics, PasteDiagnostics } from "./paste-diagnostics"
import { createDiagnosticHighlight } from "./diagnostics/Diagnostic"

/**
 * Manages in-world contents of an assembly.
 */
export interface AssemblyContent {
  readonly ownContents: State<PasteBlueprint>

  readonly imports: MutableObservableList<AssemblyImport>

  resetInWorld(): void
  readonly lastPasteConflicts: State<readonly LayerPasteConflicts[]>

  hasConflicts(): State<boolean>

  readonly resultContent: State<Blueprint | undefined> // undefined when invalid

  prepareSave(): BlueprintDiff
  readonly pendingSave: State<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

  commitAndReset(): BlueprintDiff | undefined

  saveAndAddImport(imp: AssemblyImport): void

  // isUpToDate(): boolean
  // above is false when imports have changed

  delete(): void
}

export interface LayerPasteConflicts {
  readonly name: State<LocalisedString> | undefined
  readonly bpConflicts: BlueprintPasteConflicts
  readonly diagnostics: PasteDiagnostics
}

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  ownContents: MutableState<PasteBlueprint>
  readonly imports: MutableObservableList<AssemblyImport> = observableList()
  readonly resultContent: MutableState<Blueprint | undefined>
  private importsContent: Blueprint = Blueprint.of()

  lastPasteConflicts: MutableState<LayerPasteConflicts[]> = state([
    {
      name: undefined,
      bpConflicts: {},
      diagnostics: {},
    },
  ])
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  constructor(private readonly surface: LuaSurface, private readonly area: BoundingBoxRead) {
    const content = Blueprint.take(surface, area, area.left_top)
    this.ownContents = state(content)
    this.resultContent = state(content)
  }

  resetInWorld(): void {
    clearBuildableEntities(this.surface, this.area)

    const pasteConflicts: LayerPasteConflicts[] = []
    for (const imp of this.imports.value()) {
      pasteConflicts.push(this.pasteImport(imp))
    }
    this.importsContent = Blueprint.take(this.surface, this.area)

    pasteConflicts.push(this.pasteOwnContents(this.importsContent))
    this.lastPasteConflicts.set(pasteConflicts)

    this.resultContent.set(Blueprint.take(this.surface, this.area))
  }

  private pasteImport(imp: AssemblyImport): LayerPasteConflicts {
    const content = imp.content().get()
    if (!content)
      return {
        name: imp.name(),
        bpConflicts: {},
        diagnostics: {},
      }

    const relativePosition = imp.getRelativePosition()
    const conflicts = findBlueprintPasteConflictsInWorld(this.surface, this.area, content, relativePosition)
    return this.pasteContentAndRenderDiagnostics(relativePosition, content, conflicts, imp.name())
  }

  private pasteOwnContents(importsContent: Blueprint): LayerPasteConflicts {
    const ownContents = this.ownContents.get()
    const conflicts = findBlueprintPasteConflictsAndUpdate(importsContent, ownContents)
    return this.pasteContentAndRenderDiagnostics(undefined, ownContents, conflicts, undefined)
  }

  private pasteContentAndRenderDiagnostics(
    relativePosition: MapPositionTable | undefined,
    content: PasteBlueprint,
    conflicts: BlueprintPasteConflicts,
    name: State<LocalisedString> | undefined,
  ) {
    const leftTop = this.area.left_top
    const worldLeftTop = relativePosition ? pos.add(leftTop, relativePosition) : leftTop
    pasteBlueprint(this.surface, worldLeftTop, content.entities, this.area)

    const diagnostics = mapPasteConflictsToDiagnostics(conflicts, this.surface, worldLeftTop)
    DefaultAssemblyContent.renderDiagnostics(diagnostics)
    return { name, bpConflicts: conflicts, diagnostics }
  }

  private static renderDiagnostics(collection: PasteDiagnostics): void {
    for (const [, diagnostics] of pairs(collection)) {
      for (const diagnostic of diagnostics) {
        createDiagnosticHighlight(diagnostic)
      }
    }
  }

  hasConflicts(): State<boolean> {
    return this.lastPasteConflicts.map(funcRef(DefaultAssemblyContent.hasAnyConflicts))
  }
  private static hasAnyConflicts(this: void, conflicts: LayerPasteConflicts[]): boolean {
    for (const conflict of conflicts) {
      if (!isEmpty(conflict.bpConflicts)) {
        return true
      }
    }
    return false
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
    this.imports.push(imp)
    this.commitAndReset()
  }

  delete(): void {
    this.resultContent.set(undefined)
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BoundingBoxRead): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
