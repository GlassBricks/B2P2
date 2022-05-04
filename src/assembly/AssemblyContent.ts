import { Classes } from "../lib"
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

export interface AssemblyContent {
  readonly ownContents: PasteBlueprint

  readonly imports: MutableObservableList<AssemblyImport>

  resetInWorld(): void
  readonly lastPasteConflicts: State<readonly BlueprintPasteConflicts[]>

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

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  ownContents: PasteBlueprint
  readonly imports: MutableObservableList<AssemblyImport> = observableList()
  readonly resultContent: MutableState<Blueprint | undefined>

  private importsContent: Blueprint

  lastPasteConflicts: MutableState<readonly BlueprintPasteConflicts[]> = state([{}])
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  constructor(private readonly surface: LuaSurface, private readonly area: BoundingBoxRead) {
    const content = Blueprint.take(surface, area, area.left_top)
    this.ownContents = content
    this.importsContent = Blueprint.of()
    this.resultContent = state(content)
  }

  resetInWorld(): void {
    clearBuildableEntities(this.surface, this.area)

    const pasteConflicts: BlueprintPasteConflicts[] = []
    for (const imp of this.imports.value()) {
      pasteConflicts.push(this.pasteImport(imp))
    }
    this.importsContent = Blueprint.take(this.surface, this.area)

    pasteConflicts.push(this.pasteOwnContents(this.importsContent))
    this.lastPasteConflicts.set(pasteConflicts)

    this.resultContent.set(Blueprint.take(this.surface, this.area))
  }

  private pasteImport(imp: AssemblyImport) {
    const content = imp.getContent().get()
    if (!content) return {}

    const resultLocation = pos.add(this.area.left_top, imp.getRelativePosition())
    const diagnostics = findBlueprintPasteConflictsInWorld(this.surface, this.area, content, resultLocation)
    pasteBlueprint(this.surface, resultLocation, content.entities, this.area)
    return diagnostics
  }
  private pasteOwnContents(importsContent: Blueprint): BlueprintPasteConflicts {
    const conflicts = findBlueprintPasteConflictsAndUpdate(importsContent, this.ownContents)
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents.entities)
    return conflicts
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
