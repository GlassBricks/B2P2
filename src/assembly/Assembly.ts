import { Classes, Events } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { PasteBlueprint } from "../blueprint/paste-entity"
import { MutableBlueprint } from "../blueprint/Blueprint"
import { takeBlueprint } from "../world-interaction/blueprint"

@Classes.register()
export class Assembly {
  public ownContents: PasteBlueprint
  private constructor(public name: string, public readonly surface: LuaSurface, public readonly area: BoundingBoxRead) {
    this.ownContents = MutableBlueprint.fromEntities(takeBlueprint(surface, area))
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
