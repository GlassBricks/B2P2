import { bound, Classes, PlayerData, reg } from "../../lib"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../../lib/factoriojsx"
import { GuiConstants } from "../../constants"
import { Assembly } from "../../assembly/Assembly"
import { AMTitleBar } from "./AMTitleBar"
import { AMSubframeButtons } from "./AMSubframeButtons"
import { L_Gui } from "../../locale"
import { ImportsTab } from "./Imports"
import { DiagnosticsTab } from "./Diagnostics"

@Classes.register()
class AssemblyManager extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  element!: FrameGuiElementMembers

  render(props: { assembly: Assembly }, tracker: Tracker): Spec {
    assert(props.assembly.isValid())

    this.assembly = props.assembly

    tracker.onMount((element) => {
      this.element = element as FrameGuiElementMembers
      openedAssemblies[element.player_index].set(props.assembly, this)
      tracker.onDestroy(reg(this.onDestroyed))
      const subscription = this.assembly.onDeleteEvent()!.subscribe(reg(this.closeSelf))
      tracker.onDestroy(subscription)
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
                .hasConflicts()
                .choice([L_Gui.DiagnosticsWithConflicts], [L_Gui.Diagnostics])}
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

  @bound
  closeSelf(): void {
    destroy(this.element)
  }
}

const openedAssemblies = PlayerData("opened AssembliesManager", () => new LuaMap<Assembly, AssemblyManager>())
export function openAssemblyManager(player: LuaPlayer, assembly: Assembly): void {
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
