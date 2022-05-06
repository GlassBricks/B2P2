import { Assembly } from "../../assembly/Assembly"
import { bind, bound, Classes, funcRef, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Styles } from "../../constants"
import { Fn } from "../components/Fn"
import { PasteDiagnosticId } from "../../assembly/paste-diagnostics"
import { createDiagnosticHighlight, Diagnostic, getDiagnosticCategory } from "../../assembly/diagnostics/Diagnostic"
import { LayerPasteConflicts } from "../../assembly/AssemblyContent"
import { L_Gui } from "../../locale"
import { MaybeState } from "../../lib/observable"
import { isEmpty } from "../../lib/util"

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
    const layerName: MaybeState<LocalisedString> = conflicts.name?.map(funcRef(DiagnosticsTab.importLabel)) ?? [
      L_Gui.OwnContents,
    ]
    const allDiagnostics = conflicts.diagnostics
    const categories = Object.keys(allDiagnostics) as PasteDiagnosticId[]
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
              enabled={diagnostic.relativePosition !== undefined}
              on_gui_click={diagnostic.relativePosition && bind(this.teleportTo, this, diagnostic)}
            />
          ))}
        </flow>
      </flow>
    )
  }

  @bound
  private teleportTo(diagnostic: Diagnostic, event: OnGuiClickEvent) {
    const surface = this.assembly.surface
    const leftTop = this.assembly.area.left_top

    const highlight = createDiagnosticHighlight(
      diagnostic,
      surface,
      leftTop,
      {
        blink_interval: 20,
        time_to_live: 300,
        box_type: "entity",
        render_player_index: event.player_index,
      },
      1.1,
    )!

    const position = highlight.position
    const player = game.get_player(event.player_index)!

    if (player.character && player.surface === surface) {
      player.zoom_to_world(position, 1)
    } else {
      player.close_map()
      player.teleport(position, surface)
    }
  }
}
