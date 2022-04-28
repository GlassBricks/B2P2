import { Classes } from "../lib"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
} from "../blueprint/blueprint-paste"
import { Import } from "./Import"
import { Blueprint, PasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { MutableObservableArray, observableArray } from "../lib/observable/ObservableArray"
import { pos } from "../lib/geometry/position"
import { MutableObservableValue, observable, ObservableValue } from "../lib/observable"

export interface AssemblyImport {
  readonly content: Import
  readonly relativePosition: MapPositionTable
}

export interface AssemblyContent {
  readonly ownContents: PasteBlueprint

  readonly imports: MutableObservableArray<AssemblyImport>

  resetInWorld(): void
  readonly lastPasteConflicts: ObservableValue<BlueprintPasteConflicts[]>

  prepareSave(): BlueprintDiff
  readonly pendingSave: ObservableValue<BlueprintDiff | undefined>
  commitSave(): BlueprintDiff | undefined

  // isUpToDate(): boolean
  // above is false when imports have changed

  delete(): void
}

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  ownContents: PasteBlueprint
  imports: MutableObservableArray<AssemblyImport> = observableArray()

  private importsContent: Blueprint

  lastPasteConflicts: MutableObservableValue<BlueprintPasteConflicts[]> = observable([{}])
  pendingSave: MutableObservableValue<BlueprintDiff | undefined> = observable(undefined)

  constructor(private readonly surface: LuaSurface, private readonly area: BoundingBoxRead) {
    this.ownContents = Blueprint.take(surface, area, area.left_top)
    this.importsContent = Blueprint.of()
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
  }

  private pasteImport(imp: AssemblyImport) {
    const content = imp.content.getContent()
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
  }
}

export function createAssemblyContent(surface: LuaSurface, area: BoundingBoxRead): AssemblyContent {
  return new DefaultAssemblyContent(surface, area)
}
