import { AreaIdentification } from "../area/AreaIdentification"
import { Colors } from "../constants"
import { bound, Classes, Events, raiseUserError, reg } from "../lib"
import { bbox } from "../lib/geometry"
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
  readonly displayName: State<LocalisedString>

  private readonly boxRenderId: number
  private readonly textRenderId: number

  // lifecycle

  private constructor(
    name: string,
    public readonly surface: LuaSurface,
    public readonly area: BoundingBoxRead,
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

  static create(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    area = bbox.scale(area, 0.5).roundTile().scale(2) // round to nearest even tile, so that rails work
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    return Assembly.createUnchecked(name, surface, area)
  }

  private static createUnchecked(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    const content = createAssemblyContent(surface, area)
    const assembly = new Assembly(name, surface, area, content)
    global.assemblies.add(assembly)
    AssemblyCreated.raise(assembly)
    return assembly
  }

  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BoundingBoxRead) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      assembly.highlightForError()
      raiseUserError([L_Interaction.IntersectsExistingAssembly, assembly.name.value], "flying-text")
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
    return name === "" ? [L_Gui.UnnamedAssembly] : name
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
}
Events.on_init(() => {
  global.assemblies = observableSet()
})
Events.on_surface_deleted(() => {
  if (global.assemblies)
    for (const [assembly] of global.assemblies) {
      if (!assembly.surface.valid) {
        assembly.delete()
      }
    }
})
