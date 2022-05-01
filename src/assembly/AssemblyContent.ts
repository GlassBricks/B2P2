import { Classes } from "../lib"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
} from "../blueprint/blueprint-paste"
import { Import } from "./imports/Import"
import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { MutableObservableList, observableList } from "../lib/observable/ObservableList"
import { pos } from "../lib/geometry/position"
import { MutableState, state, State } from "../lib/observable"

export interface AssemblyImport {
  readonly content: Import
  readonly relativePosition: MapPositionTable
}

export interface AssemblyContent {
  readonly ownContents: PasteBlueprint

  readonly imports: MutableObservableList<AssemblyImport>

  resetInWorld(): void
  readonly lastPasteConflicts: State<BlueprintPasteConflicts[]>

  readonly resultContent: State<Blueprint | undefined> // undefined when invalid

  prepareSave(): BlueprintDiff
  readonly pendingSave: State<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

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

  lastPasteConflicts: MutableState<BlueprintPasteConflicts[]> = state([{}])
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
    const content = imp.content.getContent().get()
    if (!content) return {}

    const resultLocation = pos.add(this.area.left_top, imp.relativePosition)
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

  delete(): void {
    this.imports.end()
    this.resultContent.set(undefined)
    this.resultContent.end()
    this.lastPasteConflicts.end()
    this.pendingSave.end()
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BoundingBoxRead): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
