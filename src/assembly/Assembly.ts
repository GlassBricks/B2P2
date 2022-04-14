import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { PasteBlueprint } from "../blueprint/paste-entity"
import { Blueprint, MutableBlueprint } from "../blueprint/Blueprint"
import { clearBuildableEntities, pasteBlueprint, takeBlueprint } from "../world-interaction/blueprint"
import { ImportContent } from "./Import"
import { pos } from "../lib/geometry/position"

interface AssemblyImport {
  content: ImportContent
  relativePosition: MapPositionTable
}

@Classes.register()
export class Assembly {
  public ownContents: PasteBlueprint
  private imports: AssemblyImport[] = []
  private resultContent: Blueprint

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
  }

  static getAllAssemblies(): ReadonlyLuaSet<Assembly> {
    return global.assemblies
  }

  refreshInWorld(): void {
    clearBuildableEntities(this.surface, this.area)
    for (const importContent of this.imports) {
      const resultLocation = pos.add(this.area.left_top, importContent.relativePosition)
      pasteBlueprint(this.surface, resultLocation, importContent.content.getContents().getAsArray(), this.area)
    }
    pasteBlueprint(this.surface, this.area.left_top, this.ownContents.getAsArray())
    const contents = takeBlueprint(this.surface, this.area)
    this.resultContent = MutableBlueprint.fromPlainEntities(contents)
  }

  addImport(content: ImportContent, position: MapPositionTable): void {
    this.imports.push({
      content,
      relativePosition: position,
    })
  }

  getLastResultContent(): Blueprint {
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
