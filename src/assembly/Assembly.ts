import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { PasteBlueprint } from "../blueprint/paste-entity"
import { Blueprint, MutableBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint, takeBlueprint } from "../world-interaction/blueprint"
import { Import } from "./Import"
import { pos } from "../lib/geometry/position"

interface InternalAssemblyImport {
  readonly content: Import
  relativePosition: MapPositionTable
}

@Classes.register()
export class Assembly {
  private imports: InternalAssemblyImport[] = []
  public ownContents: PasteBlueprint
  private resultContent: Blueprint | undefined

  private constructor(public name: string, public readonly surface: LuaSurface, public readonly area: BoundingBoxRead) {
    this.resultContent = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    this.ownContents = this.resultContent
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

  refreshInWorld(): void {
    assert(this.isValid())
    clearBuildableEntities(this.surface, this.area)
    for (const theImport of this.imports) {
      const resultLocation = pos.add(this.area.left_top, theImport.relativePosition)
      const contents = theImport.content.getContents()
      if (contents) {
        pasteBlueprint(this.surface, resultLocation, contents.getAsArray(), this.area)
      }
    }
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents!.getAsArray())
    const contents = takeBlueprint(this.surface, this.area)
    this.resultContent = MutableBlueprint.fromPlainEntities(contents)
  }

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

  refreshAndGetResultContent(): Blueprint {
    this.refreshInWorld()
    return this.getLastResultContent()!
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
