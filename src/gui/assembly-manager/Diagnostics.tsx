import { Assembly } from "../../assembly/Assembly"
import { bind, bound, Classes, funcRef, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Styles } from "../../constants"
import { Fn } from "../components/Fn"
import { PasteDiagnosticId } from "../../assembly/paste-diagnostics"
import {
  createHighlight,
  Diagnostic,
  getDiagnosticCategory,
  getDiagnosticHighlightType,
} from "../../assembly/diagnostics/Diagnostic"
import { LayerPasteDiagnostics } from "../../assembly/AssemblyContent"
import { L_Gui } from "../../locale"
import { MaybeState } from "../../lib/observable"
import { isEmpty } from "../../lib/util"
import { AreaIdentification } from "../../assembly/AreaIdentification"

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
          from={props.assembly.getContent()!.pasteDiagnostics}
          map={reg(this.mapDiagnosticsToListItem)}
        />
      </scroll-pane>
    )
  }

  @bound
  private mapDiagnosticsToListItem(diagnostics: readonly LayerPasteDiagnostics[]): Spec {
    if (!diagnostics.some((x) => !isEmpty(x.diagnostics))) {
      return <label style="bold_label" caption={[L_Gui.NoDiagnostics]} />
    }

    return <>{diagnostics.map((conflict) => this.diagnosticsForLayer(conflict))}</>
  }

  private diagnosticsForLayer(layerDiagnostics: LayerPasteDiagnostics): Spec {
    const layerName: MaybeState<LocalisedString> = layerDiagnostics.name?.map(funcRef(DiagnosticsTab.importLabel)) ?? [
      L_Gui.OwnContents,
    ]
    const allDiagnostics = layerDiagnostics.diagnostics
    if (isEmpty(allDiagnostics)) return <></>
    const categories = Object.keys(allDiagnostics) as PasteDiagnosticId[]

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
          {categories.map((name) => this.diagnosticsForCategory(name, allDiagnostics[name]!))}
        </frame>
      </>
    )
  }

  private static importLabel(this: void, name: LocalisedString): LocalisedString {
    return [L_Gui.ImportLabel, name]
  }

  private diagnosticsForCategory(categoryName: string, diagnostics: Diagnostic[]): Spec {
    const category = getDiagnosticCategory(categoryName)!
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
              tooltip={[L_Gui.DiagnosticTooltip]}
              on_gui_click={bind(this.diagnosticClicked, this, diagnostic)}
              mouse_button_filter={["left"]}
            />
          ))}
        </flow>
      </flow>
    )
  }

  @bound
  private diagnosticClicked(diagnostic: Diagnostic, event: OnGuiClickEvent) {
    if (!event.control) {
      DiagnosticsTab.showDiagnosticMainLocation(diagnostic, event)
    } else {
      DiagnosticsTab.showDiagnosticAltLocation(diagnostic, event)
    }
  }

  private static showDiagnosticMainLocation(diagnostic: Diagnostic, event: OnGuiClickEvent) {
    const location = diagnostic.highlightLocation ?? diagnostic.location
    if (!location) return
    DiagnosticsTab.createHighlightAndTeleportPlayer(location, game.get_player(event.player_index)!, "entity")
  }
  private static showDiagnosticAltLocation(diagnostic: Diagnostic, event: OnGuiClickEvent) {
    const location = diagnostic.altHighlightLocation ?? diagnostic.altLocation
    if (!location) return
    DiagnosticsTab.createHighlightAndTeleportPlayer(location, game.get_player(event.player_index)!, "copy")
    if (diagnostic.altHighlightLocation && diagnostic.altLocation) {
      DiagnosticsTab.createHighlight(
        diagnostic.altLocation,
        getDiagnosticHighlightType(diagnostic.id),
        event.player_index,
        false,
      )
    }
  }

  private static createHighlightAndTeleportPlayer(
    location: AreaIdentification,
    player: LuaPlayer,
    boxType: CursorBoxRenderType,
  ) {
    const highlight = DiagnosticsTab.createHighlight(location, boxType, player.index, true)
    const position = highlight.position
    DiagnosticsTab.teleportPlayerToPos(player, location.surface, position)
  }

  private static createHighlight(
    location: AreaIdentification,
    boxType: CursorBoxRenderType,
    playerIndex: PlayerIndex,
    blinking: boolean,
  ) {
    return createHighlight(location, boxType, {
      blink_interval: blinking ? 20 : undefined,
      time_to_live: 300,
      render_player_index: playerIndex,
    })!
  }
  private static teleportPlayerToPos(player: LuaPlayer, surface: LuaSurface, position: MapPositionTable) {
    if (player.character && player.surface === surface) {
      player.zoom_to_world(position, 1)
    } else {
      player.close_map()
      player.teleport(position, surface)
    }
  }
}
