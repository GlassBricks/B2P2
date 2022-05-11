import { bound, Classes, funcRef, PlayerData, reg } from "../../lib"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../../lib/factoriojsx"
import { GuiConstants } from "../../constants"
import { Assembly, AssemblyDeleted } from "../../assembly/Assembly"
import { AMTitleBar } from "./AMTitleBar"
import { AMSubframeButtons } from "./AMSubframeButtons"
import { L_Gui } from "../../locale"
import { ImportsTab } from "./Imports"
import { DiagnosticsTab } from "./Diagnostics"
import { closeParentParent } from "../components/TitleBar"
import { _open } from "./open"

@Classes.register()
class AssemblyManager extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  element!: FrameGuiElementMembers

  render(props: { assembly: Assembly }, tracker: Tracker): Spec {
    this.assembly = props.assembly

    tracker.onMount((element) => {
      this.element = element as FrameGuiElementMembers
      openedAssemblies[element.player_index].set(props.assembly, this)
      tracker.onDestroy(reg(this.onDestroyed))
    })

    return (
      <frame
        auto_center
        direction="vertical"
        styleMod={{
          width: GuiConstants.AssemblyManagerWidth,
        }}
      >
        <AMTitleBar assembly={this.assembly} onClose={funcRef(closeParentParent)} />
        <frame
          style="inside_deep_frame_for_tabs"
          direction="vertical"
          styleMod={{
            top_padding: 5,
          }}
        >
          <AMSubframeButtons assembly={this.assembly} />
          <tabbed-pane
            style="tabbed_pane_with_extra_padding"
            styleMod={{
              horizontally_stretchable: true,
              top_margin: 10,
            }}
          >
            <tab caption={[L_Gui.Imports]} />
            <ImportsTab assembly={this.assembly} />
            <tab
              caption={this.assembly
                .getContent()!
                .hasConflicts.switch([L_Gui.DiagnosticsWithConflicts], [L_Gui.Diagnostics])}
            />
            <DiagnosticsTab assembly={this.assembly} />
          </tabbed-pane>
        </frame>
      </frame>
    )
  }

  @bound
  onDestroyed(): void {
    openedAssemblies[this.element.player_index].delete(this.assembly)
  }

  // @bound
  closeSelf(): void {
    destroy(this.element)
  }
}

const openedAssemblies = PlayerData("opened AssembliesManager", () => new LuaMap<Assembly, AssemblyManager>())
log("FOOOOO")
_open.openAssemblyManager = function (player: LuaPlayer, assembly: Assembly): void {
  if (!assembly.isValid()) return
  const existingWindow = openedAssemblies[player.index].get(assembly)
  if (existingWindow) {
    if (existingWindow.element.valid) {
      existingWindow.element.bring_to_front()
      return
    }
    // should not happen...
    openedAssemblies[player.index].delete(assembly)
  }
  render(player.gui.screen, <AssemblyManager assembly={assembly} />)
}

AssemblyDeleted.subscribe((assembly) => {
  for (const [, assemblies] of openedAssemblies) {
    assemblies.get(assembly)?.closeSelf()
    assemblies.delete(assembly)
  }
})
