import { Classes, Events } from "../lib"
import { PRecord } from "../lib/util-types"
import { bbox } from "../lib/geometry/bounding-box"
import { PasteBlueprint } from "../blueprint/paste-entity"
import { MutableBlueprint } from "../blueprint/Blueprint"
import { takeBlueprint } from "../world-interaction/blueprint"

export type AssemblyId = number & { _assemblyIdBrand: never }

@Classes.register()
export class Assembly {
  public ownContents: PasteBlueprint
  private constructor(
    public readonly id: AssemblyId,
    public name: string,
    public readonly surface: LuaSurface,
    public readonly area: BoundingBoxRead,
  ) {
    this.ownContents = MutableBlueprint.fromEntities(takeBlueprint(surface, area))
  }

  static create(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    const id = (luaLength(global.assemblies) + 1) as AssemblyId
    const assembly = new Assembly(id, name, surface, area)
    global.assemblies[id] = assembly
    return assembly
  }
  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BoundingBoxRead) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      error(`This intersects with an existing assembly: ${assembly.name}`)
    }
  }
  private static findAssemblyInArea(surface: LuaSurface, area: BoundingBoxRead): Assembly | undefined {
    for (const [, assembly] of pairs(global.assemblies)) {
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

  static getById(id: AssemblyId): Assembly | undefined {
    const assembly = global.assemblies[id]
    if (assembly && assembly.isValid()) {
      return assembly
    }
  }

  delete(): void {
    delete global.assemblies[this.id]
  }

  isValid(): boolean {
    return this.surface.valid && global.assemblies[this.id] === this
  }
}

export interface AssembliesGlobal {
  assemblies: PRecord<AssemblyId, Assembly>
}
declare const global: AssembliesGlobal
Events.on_init(() => {
  global.assemblies = {}
})
Events.on_surface_deleted(() => {
  for (const [, assembly] of pairs(global.assemblies)) {
    if (!assembly.surface.valid) {
      assembly.delete()
    }
  }
})
