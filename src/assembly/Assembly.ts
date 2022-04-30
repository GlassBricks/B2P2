import { bound, Classes, Events, reg } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { MutableObservableSet, observableSet, ObservableSet } from "../lib/observable/ObservableSet"
import { UserError } from "../player-interaction/protected-action"
import { L_Interaction } from "../locale"
import { Colors } from "../constants"
import { Event, MutableState, Observable, observable } from "../lib/observable"
import { AssemblyContent, createAssemblyContent } from "./AssemblyContent"

@Classes.register()
export class Assembly {
  readonly name: MutableState<string>
  readonly onDelete: Event<void> = new Event()

  private readonly boxRenderId: number
  private readonly textRenderId: number

  // lifecycle

  private constructor(
    name: string,
    public readonly surface: LuaSurface,
    public readonly area: BoundingBoxRead,
    private readonly content: AssemblyContent,
  ) {
    this.name = observable(name)
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

  @bound
  private setName(name?: string): void {
    if (name) rendering.set_text(this.textRenderId, name)
  }

  static create(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    area = bbox.roundTile(area)
    assert(surface.valid)
    Assembly.checkDoesNotIntersectExistingArea(surface, area)

    return Assembly._createUnchecked(name, surface, area)
  }

  static _createUnchecked(name: string, surface: LuaSurface, area: BoundingBoxRead): Assembly {
    const content = createAssemblyContent(surface, area)
    const assembly = new Assembly(name, surface, area, content)
    global.assemblies.add(assembly)
    return assembly
  }

  private static checkDoesNotIntersectExistingArea(surface: LuaSurface, area: BoundingBoxRead) {
    const assembly = Assembly.findAssemblyInArea(surface, area)
    if (assembly) {
      assembly.highlightForError()
      throw new UserError([L_Interaction.IntersectsExistingAssembly, assembly.name.value], "flying-text")
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

  isValid(): boolean {
    return this.surface.valid && global.assemblies.has(this)
  }
  delete(): void {
    if (!global.assemblies.has(this)) return
    global.assemblies.delete(this)
    this.content.delete()
    rendering.destroy(this.boxRenderId)
    rendering.destroy(this.textRenderId)
    this.onDelete.raise()
  }

  getContent(): AssemblyContent | undefined {
    if (this.isValid()) return this.content
  }

  onDeleteEvent(): Observable<void> | undefined {
    if (this.isValid()) return this.onDelete
  }

  static getAllAssemblies(): ObservableSet<Assembly> {
    return global.assemblies
  }

  // interaction
  teleportPlayer(player: LuaPlayer): void {
    player.teleport(bbox.center(this.area), this.surface)
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
