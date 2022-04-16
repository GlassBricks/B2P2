import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { Blueprint, getBlueprintFromWorld, MutableBlueprint, UpdateablePasteBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { Import } from "./Import"
import { pos } from "../lib/geometry/position"
import { computeBlueprintDiff, findBlueprintPasteContentsInWorldAndUpdate } from "../blueprint/blueprint-paste"
import { Diagnostic, DiagnosticFactory } from "../diagnostics/Diagnostic"
import { L_Diagnostic } from "../locale"
import { describeEntity, Entity } from "../entity/entity"
import { PropUpdateBehaviors, UnhandledProp } from "../entity/entity-props"

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
  (pasted: BlueprintEntityRead, overlapped: BlueprintEntityRead) => ({
    message: [L_Diagnostic.Overlap, describeEntity(pasted), describeEntity(overlapped)],
    location: pasted.position,
  }),
)

export const CannotUpgrade = DiagnosticFactory(
  L_Diagnostic.CannotUpgrade,
  "error",
  (pasted: BlueprintEntityRead, overlapped: BlueprintEntityRead) => ({
    message: [L_Diagnostic.CannotUpgrade, describeEntity(pasted), describeEntity(overlapped)],
    location: pasted.position,
  }),
)

export const ItemsIgnored = DiagnosticFactory(
  L_Diagnostic.ItemsIgnoredOnPaste,
  "warning",
  (pasted: BlueprintEntityRead) => ({
    message: [L_Diagnostic.ItemsIgnoredOnPaste, describeEntity(pasted)],
    location: pasted.position,
  }),
)

export const UnsupportedProp = DiagnosticFactory(
  L_Diagnostic.UnsupportedProp,
  "warning",
  (pasted: BlueprintEntityRead, property: UnhandledProp) => ({
    message: [L_Diagnostic.UnsupportedProp, describeEntity(pasted), property],
    location: pasted.position,
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
    this.resultContent = getBlueprintFromWorld(surface, area)
    this.ownContents = this.resultContent
    this.importsContent = new MutableBlueprint()
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

  static getAllAssemblies(): ReadonlyLuaSet<Assembly> {
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
    this.importsContent = getBlueprintFromWorld(this.surface, this.area)

    pasteDiagnostics.push(this.pasteOwnContentAndCheckConflicts())
    this.pasteDiagnostics = pasteDiagnostics

    this.resultContent = getBlueprintFromWorld(this.surface, this.area)
  }

  private pasteImportAndCheckConflicts(imp: InternalAssemblyImport) {
    const content = imp.content.getContent()
    if (!content) return []

    const resultLocation = pos.add(this.area.left_top, imp.relativePosition)
    const diagnostics = this.checkForPasteConflicts(content, resultLocation)
    pasteBlueprint(this.surface, resultLocation, content.getAsArray(), this.area)
    return diagnostics
  }

  private pasteOwnContentAndCheckConflicts() {
    const content = this.ownContents

    const diagnostics = this.checkForPasteConflicts(content, this.area.left_top)
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents!.getAsArray())
    return diagnostics
  }

  private checkForPasteConflicts(
    content: Blueprint<Entity>,
    resultLocation: MapPositionTable,
  ): Diagnostic<PasteDiagnostics>[] {
    const conflicts = findBlueprintPasteContentsInWorldAndUpdate(this.surface, this.area, content, resultLocation)
    const diagnostics: Diagnostic<PasteDiagnostics>[] = []
    for (const overlap of conflicts.overlaps) {
      diagnostics.push(Overlap(overlap.above, overlap.below))
    }
    for (const { prop, below, above } of conflicts.propConflicts) {
      // this relies on "name" being the only unpasteable prop (while still being compatible)
      // see entity-paste.ts
      if (prop === "name") {
        diagnostics.push(CannotUpgrade(below, above))
      } else if (prop === "items") {
        diagnostics.push(ItemsIgnored(above))
      } else if (PropUpdateBehaviors[prop] === undefined) {
        diagnostics.push(UnsupportedProp(above, prop))
      }
    }
    return diagnostics
  }

  saveChanges(): void {
    if (!this.importsContent) return
    const diff = computeBlueprintDiff(this.importsContent!, getBlueprintFromWorld(this.surface, this.area))
    // todo: deal with deletions
    this.ownContents = diff.content
  }

  saveAndRefresh(): void {
    this.saveChanges()
    this.refreshInWorld()
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
  assemblies: LuaSet<Assembly>
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
