import { Assembly } from "../../assembly/Assembly"
import { bound, Classes, funcRef, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Styles } from "../../constants"
import { Fn } from "../components/Fn"
import { mapPasteConflictsToDiagnostics, PasteDiagnostic } from "../../assembly/paste-diagnostics"
import { DiagnosticsForCategory } from "../../assembly/diagnostics/Diagnostic"
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
    return <>{conflicts.map((conflict) => DiagnosticsTab.diagnosticsForLayer(conflict))}</>
  }

  private static layerLabel(this: void, name: LocalisedString): LocalisedString {
    return [L_Gui.LayerLabel, name]
  }

  private static diagnosticsForLayer(conflicts: LayerPasteConflicts): Spec {
    const layerName: MaybeState<LocalisedString> = conflicts.name?.map(funcRef(this.layerLabel)) ?? [L_Gui.OwnContents]
    const allDiagnostics = mapPasteConflictsToDiagnostics(conflicts.bpConflicts)
    const categories = Object.keys(allDiagnostics) as PasteDiagnostic[]

    return (
      <>
        <label caption={layerName} styleMod={{ font: "default-large-bold" }} />
        <frame
          direction="vertical"
          style="deep_frame_in_shallow_frame"
          styleMod={{
            horizontally_stretchable: true,
            padding: 5,
          }}
        >
          {isEmpty(categories) ? (
            <label caption={[L_Gui.NoDiagnostics]} />
          ) : (
            categories.map((name) => DiagnosticsTab.diagnosticsForCategory(allDiagnostics[name]!))
          )}
        </frame>
      </>
    )
  }
  private static diagnosticsForCategory(group: DiagnosticsForCategory<PasteDiagnostic>) {
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
            <label caption={diagnostic.message} />
          ))}
        </flow>
      </flow>
    )
  }
}
