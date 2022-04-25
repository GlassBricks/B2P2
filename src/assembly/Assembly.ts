import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { Blueprint, UpdateablePasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { Import } from "./Import"
import { pos } from "../lib/geometry/position"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
} from "../blueprint/blueprint-paste"
import { MutableObservableSet, observableSet, ObservableSet } from "../lib/observable/ObservableSet"
import { userError } from "../player-interaction/protected-action"
import { L_Interaction } from "../locale"

interface InternalAssemblyImport {
  readonly content: Import
  relativePosition: MapPositionTable
}

@Classes.register()
export class Assembly {
  private imports: InternalAssemblyImport[] = []
  public ownContents: UpdateablePasteBlueprint
  private importsContent: Blueprint
  private resultContent: Blueprint | undefined

  private pasteConflicts: readonly BlueprintPasteConflicts[] = []

  // lifecycle

  private constructor(public name: string, public readonly surface: LuaSurface, public readonly area: BoundingBoxRead) {
    this.resultContent = Blueprint.take(surface, area, area.left_top)
    this.ownContents = this.resultContent
    this.importsContent = Blueprint.of()
  }

  static create(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    area = bbox.roundTile(area)
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    return Assembly._createUnchecked(name, surface, area)
  }

  static _createUnchecked(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    const assembly = new Assembly(name, surface, area)
    global.assemblies.add(assembly)
    return assembly
  }

  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BoundingBoxRead) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      userError([L_Interaction.IntersectsExistingAssembly, assembly.name])
    }
  }
  private static findAssemblyInArea(surface: LuaSurface, area: BoundingBoxRead): Assembly | undefined {
    for (const [assembly] of global.assemblies) {
      if (
        assembly.isValid() &&
        assembly.surface.index === surface.index &&
        bbox.intersectsNonZeroArea(assembly.area, area)
      ) {
        return assembly
      }
    }
    return undefined
  }

  isValid(): boolean {
    return this.surface.valid && global.assemblies.has(this)
  }
  delete(): void {
    global.assemblies.delete(this)
    this.ownContents = undefined!
    this.importsContent = undefined!
    this.resultContent = undefined!
  }

  static getAllAssemblies(): ObservableSet<Assembly> {
    return global.assemblies
  }

  // place and save

  refreshInWorld(): void {
    assert(this.isValid())
    clearBuildableEntities(this.surface, this.area)

    const pasteConflicts: BlueprintPasteConflicts[] = []
    for (const imp of this.imports) {
      pasteConflicts.push(this.pasteImport(imp))
    }
    this.importsContent = Blueprint.take(this.surface, this.area)

    pasteConflicts.push(this.pasteOwnContents(this.importsContent))
    this.pasteConflicts = pasteConflicts

    this.resultContent = Blueprint.take(this.surface, this.area)
  }

  private pasteImport(imp: InternalAssemblyImport) {
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

  getChanges(): BlueprintDiff {
    return computeBlueprintDiff(this.importsContent, Blueprint.take(this.surface, this.area))
  }

  commitChanges(diff: BlueprintDiff): void {
    this.ownContents = diff.content
  }

  forceSaveChanges(): void {
    this.commitChanges(this.getChanges())
  }

  getPasteConflicts(): readonly BlueprintPasteConflicts[] {
    return this.pasteConflicts
  }

  // content

  addImport(content: Import, position: MapPositionTable): void {
    this.imports.push({
      content,
      relativePosition: position,
    })
  }

  // undefined if this is invalid
  getLastResultContent(): Blueprint | undefined {
    return this.resultContent
  }
}

declare const global: {
  assemblies: MutableObservableSet<Assembly>
}
Events.on_init(() => {
  global.assemblies = observableSet()
})
Events.on_surface_deleted(() => {
  for (const [assembly] of global.assemblies) {
    if (!assembly.surface.valid) {
      assembly.delete()
    }
  }
})
