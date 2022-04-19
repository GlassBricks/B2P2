import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { Blueprint, UpdateablePasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { Import } from "./Import"
import { pos } from "../lib/geometry/position"
import {
  BlueprintDiff,
  computeBlueprintDiff,
  findBlueprintPasteConflictsInWorldAndUpdate,
} from "../blueprint/blueprint-paste"
import { Diagnostic, DiagnosticFactory } from "../diagnostics/Diagnostic"
import { L_Diagnostic } from "../locale"
import { describeEntity, Entity, isUnhandledProp, UnhandledProp } from "../entity/entity"
import { assertNever } from "../lib/util"

interface InternalAssemblyImport {
  readonly content: Import
  relativePosition: MapPositionTable
}

export type PasteDiagnostics =
  | L_Diagnostic.Overlap
  | L_Diagnostic.ItemsIgnoredOnPaste
  | L_Diagnostic.CannotUpgrade
  | L_Diagnostic.UnsupportedProp
export const Overlap = DiagnosticFactory(
  L_Diagnostic.Overlap,
  "error",
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.Overlap, describeEntity(above), describeEntity(below)],
    location: above.position,
  }),
)

export const CannotUpgrade = DiagnosticFactory(
  L_Diagnostic.CannotUpgrade,
  "error",
  (below: BlueprintEntityRead, above: BlueprintEntityRead) => ({
    message: [L_Diagnostic.CannotUpgrade, describeEntity(above), describeEntity(below)],
    location: above.position,
  }),
)

export const ItemsIgnored = DiagnosticFactory(
  L_Diagnostic.ItemsIgnoredOnPaste,
  "warning",
  (entity: BlueprintEntityRead) => ({
    message: [L_Diagnostic.ItemsIgnoredOnPaste, describeEntity(entity)],
    location: entity.position,
  }),
)

export const UnsupportedProp = DiagnosticFactory(
  L_Diagnostic.UnsupportedProp,
  "warning",
  (entity: BlueprintEntityRead, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedProp, describeEntity(entity), property],
    location: entity.position,
  }),
)

@Classes.register()
export class Assembly {
  private imports: InternalAssemblyImport[] = []
  public ownContents: UpdateablePasteBlueprint
  private importsContent: Blueprint
  private resultContent: Blueprint | undefined

  // one for every import; last is for own contents
  private pasteDiagnostics: readonly Diagnostic<PasteDiagnostics>[][] = []

  // lifecycle

  private constructor(public name: string, public readonly surface: LuaSurface, public readonly area: BoundingBoxRead) {
    this.resultContent = Blueprint.fromWorld(surface, area, area.left_top)
    this.ownContents = this.resultContent
    this.importsContent = Blueprint.fromArray([])
  }

  static create(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    const assembly = new Assembly(name, surface, area)
    global.assemblies.add(assembly)
    return assembly
  }
  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BoundingBoxRead) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      error(`This intersects with an existing assembly: ${assembly.name}`)
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
    this.resultContent = undefined!
  }

  static getAllAssemblies(): LuaSet<Assembly> {
    return global.assemblies
  }

  // place and save

  refreshInWorld(): void {
    assert(this.isValid())
    clearBuildableEntities(this.surface, this.area)

    const pasteDiagnostics: Diagnostic<PasteDiagnostics>[][] = []
    for (const imp of this.imports) {
      pasteDiagnostics.push(this.pasteImportAndCheckConflicts(imp))
    }
    this.importsContent = Blueprint.fromWorld(this.surface, this.area)

    pasteDiagnostics.push(this.pasteOwnContentAndCheckConflicts())
    this.pasteDiagnostics = pasteDiagnostics

    this.resultContent = Blueprint.fromWorld(this.surface, this.area)
  }

  private pasteImportAndCheckConflicts(imp: InternalAssemblyImport) {
    const content = imp.content.getContent()
    if (!content) return []

    const resultLocation = pos.add(this.area.left_top, imp.relativePosition)
    const diagnostics = this.checkForPasteConflicts(content, resultLocation)
    pasteBlueprint(this.surface, resultLocation, content.entities, this.area)
    return diagnostics
  }

  private pasteOwnContentAndCheckConflicts() {
    const content = this.ownContents

    const diagnostics = this.checkForPasteConflicts(content, this.area.left_top)
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents.entities)
    return diagnostics
  }

  private checkForPasteConflicts(
    content: Blueprint<Entity>,
    resultLocation: MapPositionTable,
  ): Diagnostic<PasteDiagnostics>[] {
    const conflicts = findBlueprintPasteConflictsInWorldAndUpdate(this.surface, this.area, content, resultLocation)
    const diagnostics: Diagnostic<PasteDiagnostics>[] = []
    for (const { below, above } of conflicts.overlaps) {
      diagnostics.push(Overlap(below, above))
    }
    for (const { prop, below, above } of conflicts.propConflicts) {
      // this relies on "name" being the only unpasteable prop (while still being compatible)
      // see entity-paste.ts
      if (prop === "name") {
        diagnostics.push(CannotUpgrade(below, above))
      } else if (prop === "items") {
        diagnostics.push(ItemsIgnored(above))
      } else if (isUnhandledProp(prop)) {
        diagnostics.push(UnsupportedProp(above, prop))
      } else {
        assertNever(prop)
      }
    }
    return diagnostics
  }

  getChanges(): BlueprintDiff {
    return computeBlueprintDiff(this.importsContent, Blueprint.fromWorld(this.surface, this.area))
  }

  commitChanges(diff: BlueprintDiff): void {
    this.ownContents = diff.content
  }

  forceSaveChanges(): void {
    this.commitChanges(this.getChanges())
  }

  // diagnostics

  getPasteDiagnostics(): readonly Diagnostic<PasteDiagnostics>[][] {
    return this.pasteDiagnostics
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
  assemblies: MutableLuaSet<Assembly>
}
Events.on_init(() => {
  global.assemblies = new LuaSet()
})
Events.on_surface_deleted(() => {
  for (const [assembly] of global.assemblies) {
    if (!assembly.surface.valid) {
      assembly.delete()
    }
  }
})
