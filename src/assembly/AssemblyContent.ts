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
import { isEmpty } from "../lib/util"

export interface AssemblyContent {
  readonly ownContents: PasteBlueprint

  readonly imports: MutableObservableList<AssemblyImport>

  resetInWorld(): void
  readonly lastPasteConflicts: State<readonly LayerPasteConflicts[]>

  hasConflicts(): boolean

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
}

@Classes.register()
export class DefaultAssemblyContent implements AssemblyContent {
  ownContents: PasteBlueprint
  readonly imports: MutableObservableList<AssemblyImport> = observableList()
  readonly resultContent: MutableState<Blueprint | undefined>

  private importsContent: Blueprint

  lastPasteConflicts: MutableState<LayerPasteConflicts[]> = state([
    {
      name: undefined,
      bpConflicts: {},
    },
  ])
  pendingSave: MutableState<BlueprintDiff | undefined> = state(undefined)

  constructor(private readonly surface: LuaSurface, private readonly area: BoundingBoxRead) {
    const content = Blueprint.take(surface, area, area.left_top)
    this.ownContents = content
    this.importsContent = Blueprint.of()
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
    const content = imp.getContent().get()
    if (!content)
      return {
        name: imp.getName(),
        bpConflicts: {},
      }

    const resultLocation = pos.add(this.area.left_top, imp.getRelativePosition())
    const conflicts = findBlueprintPasteConflictsInWorld(this.surface, this.area, content, resultLocation)
    pasteBlueprint(this.surface, resultLocation, content.entities, this.area)
    return { name: imp.getName(), bpConflicts: conflicts }
  }
  private pasteOwnContents(importsContent: Blueprint): LayerPasteConflicts {
    const conflicts = findBlueprintPasteConflictsAndUpdate(importsContent, this.ownContents)
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents.entities)
    return {
      name: undefined,
      bpConflicts: conflicts,
    }
  }

  hasConflicts(): boolean {
    return this.lastPasteConflicts.get().some(({ bpConflicts }) => !isEmpty(bpConflicts))
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
