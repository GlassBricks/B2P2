import { Assembly } from "../../assembly/Assembly"
import { bind, bound, Classes, funcRef, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Styles } from "../../constants"
import { Fn } from "../components/Fn"
import { mapPasteConflictsToDiagnostics, PasteDiagnostic } from "../../assembly/paste-diagnostics"
import { DiagnosticsForCategory } from "../../assembly/diagnostics/Diagnostic"
import { LayerPasteConflicts } from "../../assembly/AssemblyContent"
import { L_Gui } from "../../locale"
import { MaybeState } from "../../lib/observable"
import { isEmpty } from "../../lib/util"
import { bbox } from "../../lib/geometry/bounding-box"

@Classes.register()
export class DiagnosticsTab extends Component<{
  assembly: Assembly
}> {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    this.assembly = props.assembly
    return (
      <scroll-pane style={Styles.AMListScrollPane}>
        <Fn
          uses="flow"
          direction="vertical"
          from={props.assembly.getContent()!.lastPasteConflicts}
          map={reg(this.mapConflictsToListItems)}
        />
      </scroll-pane>
    )
  }

  @bound
  private mapConflictsToListItems(conflicts: readonly LayerPasteConflicts[]): Spec {
    if (!conflicts.some((x) => !isEmpty(x.bpConflicts))) {
      return <label style="bold_label" caption={[L_Gui.NoDiagnostics]} />
    }

    return <>{conflicts.map((conflict) => this.diagnosticsForLayer(conflict))}</>
  }

  private diagnosticsForLayer(conflicts: LayerPasteConflicts): Spec {
    const layerName: MaybeState<LocalisedString> = conflicts.name?.map(funcRef(DiagnosticsTab.layerLabel)) ?? [
      L_Gui.OwnContents,
    ]
    const allDiagnostics = mapPasteConflictsToDiagnostics(conflicts.bpConflicts)
    const categories = Object.keys(allDiagnostics) as PasteDiagnostic[]
    const hasDiagnostics = !isEmpty(categories)
    if (!hasDiagnostics) {
      return <></>
    }

    return (
      <>
        <label caption={layerName} styleMod={{ font: "default-bold" }} />
        <frame
          direction="vertical"
          style="deep_frame_in_shallow_frame"
          styleMod={{
            horizontally_stretchable: true,
            padding: 5,
          }}
        >
          {categories.map((name) => this.diagnosticsForCategory(allDiagnostics[name]!))}
        </frame>
      </>
    )
  }

  private static layerLabel(this: void, name: LocalisedString): LocalisedString {
    return [L_Gui.LayerLabel, name]
  }

  private diagnosticsForCategory(group: DiagnosticsForCategory<PasteDiagnostic>) {
    const { category, diagnostics } = group
    return (
      <flow direction="vertical">
        <label
          caption={category.shortDescription}
          tooltip={category.longDescription}
          styleMod={{ font: "default-semibold" }}
        />
        <flow
          direction="vertical"
          styleMod={{
            left_margin: 10,
          }}
        >
          {diagnostics.map((diagnostic) => (
            <button
              style="list_box_item"
              caption={diagnostic.message}
              on_gui_click={diagnostic.location && bind(this.teleportTo, this, diagnostic.location)}
            />
          ))}
        </flow>
      </flow>
    )
  }

  @bound
  private teleportTo(location: BoundingBoxRead, event: OnGuiClickEvent) {
    const player = game.get_player(event.player_index)!
    const actualLocation = bbox.shift(location, this.assembly.area.left_top)
    const surface = this.assembly.surface
    const position = bbox.center(actualLocation)

    surface.create_entity({
      name: "highlight-box",
      position,
      bounding_box: actualLocation,
      box_type: "not-allowed",
      render_player_index: event.player_index,
      blink_interval: 20,
      time_to_live: 300,
    })

    if (player.character && player.surface === surface) {
      player.zoom_to_world(position, 1)
    } else {
      player.close_map()
      player.teleport(position, surface)
    }
  }
}
