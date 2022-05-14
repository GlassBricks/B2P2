import { AreaIdentification } from "../../area/AreaIdentification"
import { teleportAndHighlight } from "../../area/teleport-history"
import { Assembly } from "../../assembly/Assembly"
import { LayerDiagnostics } from "../../assembly/AssemblyContent"
import { Diagnostic, getDiagnosticCategory, getDiagnosticHighlightType } from "../../assembly/diagnostics/Diagnostic"
import { PasteDiagnosticId } from "../../assembly/paste-diagnostics"
import { Styles } from "../../constants"
import { bind, bound, Classes, funcRef, isEmpty, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { MaybeState } from "../../lib/observable"
import { L_Diagnostic, L_Gui } from "../../locale"
import { Fn } from "../components/Fn"

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
  private mapDiagnosticsToListItem(diagnostics: readonly LayerDiagnostics[]): Spec {
    if (!diagnostics.some((x) => !isEmpty(x.diagnostics))) {
      return <label style="bold_label" caption={[L_Gui.NoDiagnostics]} />
    }

    return <>{diagnostics.map((conflict) => this.diagnosticsForLayer(conflict))}</>
  }

  private diagnosticsForLayer(layerDiagnostics: LayerDiagnostics): Spec {
    const layerName: MaybeState<LocalisedString> = layerDiagnostics.name?.map(funcRef(DiagnosticsTab.importLabel)) ?? [
      L_Gui.OwnContents,
    ]
    const allDiagnostics = layerDiagnostics.diagnostics
    if (isEmpty(allDiagnostics)) return <></>

    const categories: PasteDiagnosticId[] = []

    for (const [key, diagnostics] of pairs(allDiagnostics)) {
      if (diagnostics[0] && !diagnostics.highlightOnly) {
        categories.push(key)
      }
    }
    if (isEmpty(categories)) return <></>

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
              tooltip={
                diagnostic.altLocation
                  ? [L_Diagnostic.TooltipWithAltLocation]
                  : diagnostic.location
                  ? [L_Diagnostic.BasicTooltip]
                  : undefined
              }
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
      DiagnosticsTab.showDiagnosticLocation(event, diagnostic.location, "blueprint-snap-rectangle")
    } else {
      DiagnosticsTab.showDiagnosticLocation(event, diagnostic.altLocation, getDiagnosticHighlightType(diagnostic.id))
    }
  }

  private static showDiagnosticLocation(
    event: OnGuiClickEvent,
    location: AreaIdentification | undefined,
    boxType: CursorBoxRenderType,
  ) {
    if (!location) return
    const player = game.get_player(event.player_index)!
    teleportAndHighlight(player, location, boxType)
  }
}
