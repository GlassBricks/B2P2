import { AreaIdentification } from "../area/AreaIdentification"
import { Colors } from "../constants"
import { bound, Classes, Events, Mutable, raiseUserError, reg } from "../lib"
import { BBox, bbox } from "../lib/geometry"
import { versionStrLess } from "../lib/migration"
import {
  GlobalEvent,
  MutableObservableSet,
  MutableState,
  observableSet,
  ObservableSet,
  state,
  State,
} from "../lib/observable"
import { L_Gui, L_Interaction } from "../locale"
import { AssemblyContent, createAssemblyContent } from "./AssemblyContent"

export const AssemblyCreated = new GlobalEvent<Assembly>()
export const AssemblyDeleted = new GlobalEvent<Assembly>()

@Classes.register()
export class Assembly implements AreaIdentification {
  readonly name: MutableState<string>
  readonly id?: number
  readonly displayName: State<LocalisedString>

  private readonly boxRenderId: number
  private readonly textRenderId: number

  // lifecycle

  private constructor(
    name: string,
    public readonly surface: LuaSurface,
    public readonly area: BBox,
    private readonly content: AssemblyContent,
  ) {
    this.name = state(name)
    this.displayName = this.name.map(reg(this.unnamedIfEmpty))
    this.boxRenderId = rendering.draw_rectangle({
      left_top: area.left_top,
      right_bottom: area.right_bottom,
      surface,
      color: Colors.AssemblyOutline,
      width: 4,
      filled: false,
    })
    this.textRenderId = rendering.draw_text({
      text: name,
      surface: this.surface,
      target: this.area.left_top,
      color: Colors.AssemblyName,
      scale: 1.5,
      scale_with_zoom: true,
      only_in_alt_mode: true,
    })

    this.name.subscribe(reg(this.setName))
  }

  static create(name: string, surface: LuaSurface, area: BBox): Assembly {
    area = bbox.scale(area, 0.5).roundTile().scale(2) // round to nearest even tile, so that rails work
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    return Assembly.createUnchecked(name, surface, area)
  }

  private static createUnchecked(name: string, surface: LuaSurface, area: BBox): Assembly {
    const content = createAssemblyContent(surface, area)
    const assembly = new Assembly(name, surface, area, content)
    ;(assembly as Mutable<Assembly>).id = global.nextAssemblyId++
    global.assemblies.add(assembly)
    AssemblyCreated.raise(assembly)
    return assembly
  }

  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BBox) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      assembly.highlightForError()
      raiseUserError([L_Interaction.IntersectsExistingAssembly, assembly.name.value], "flying-text")
    }
  }
  private static findAssemblyInArea(surface: LuaSurface, area: BBox): Assembly | undefined {
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

  private highlightForError() {
    rendering.draw_rectangle({
      left_top: this.area.left_top,
      right_bottom: this.area.right_bottom,
      surface: this.surface,
      color: Colors.AssemblyError,
      width: 4,
      filled: false,
      time_to_live: 60,
    })
  }

  @bound
  private setName(name?: string): void {
    if (!name) return
    rendering.set_text(this.textRenderId, name)
  }

  @bound
  private unnamedIfEmpty(name: string): LocalisedString {
    return name === "" ? [L_Gui.UnnamedAssembly, this.id] : name
  }

  isValid(): boolean {
    return this.surface.valid && global.assemblies.has(this)
  }
  delete(): void {
    if (!global.assemblies.has(this)) return
    this.content.delete()
    rendering.destroy(this.boxRenderId)
    rendering.destroy(this.textRenderId)
    global.assemblies.delete(this)
    AssemblyDeleted.raise(this)
  }

  getContent(): AssemblyContent | undefined {
    if (this.isValid()) return this.content
  }

  static getAllAssemblies(): ObservableSet<Assembly> {
    return global.assemblies
  }

  // interaction
  canImport(assembly: Assembly): boolean {
    return assembly !== this
  }
}

declare const global: {
  assemblies: MutableObservableSet<Assembly>
  nextAssemblyId: number
}
Events.on_init(() => {
  global.assemblies = observableSet()
  global.nextAssemblyId = 1
})
Events.on_surface_deleted(() => {
  if (global.assemblies)
    for (const [assembly] of global.assemblies) {
      if (!assembly.surface.valid) {
        assembly.delete()
      }
    }
})

// todo: proper migration stuff
Events.on_configuration_changed((data) => {
  const changed = data.mod_changes[script.mod_name]
  if (!changed) return
  if (versionStrLess(changed.old_version, "0.1.2")) {
    global.nextAssemblyId ??= 1
    if (global.assemblies) {
      for (const [assembly] of global.assemblies) {
        ;(assembly as Mutable<Assembly>).id = global.nextAssemblyId++
        assembly.name.forceUpdate()
      }
    }
  }
})
