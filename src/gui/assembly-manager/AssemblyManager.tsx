import { bound, Classes, PlayerData, reg } from "../../lib"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../../lib/factoriojsx"
import { GuiConstants } from "../../constants"
import { Assembly } from "../../assembly/Assembly"
import { SaveButtons } from "./SaveButtons"
import { AMTitleBar } from "./AMTitleBar"
import { AMSubframeButtons } from "./AMSubframeButtons"

const openedAssemblies = PlayerData("opened AssembliesManager", () => new LuaMap<Assembly, AssemblyManager>())
@Classes.register()
class AssemblyManager extends Component {
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
        <AMTitleBar assembly={this.assembly} onClose={reg(this.closeSelf)} />
        <AMSubframeButtons assembly={this.assembly} />
        <frame style="inside_deep_frame_for_tabs" direction="vertical">
          <tabbed-pane
            style="tabbed_pane_with_no_side_padding"
            styleMod={{
              horizontally_stretchable: true,
            }}
          >
            <tab caption="Tab 1" />
            <label caption="Tab 1 content" />
            <tab caption="Tab 2" />
            <label caption="Tab 2 content" />
          </tabbed-pane>
        </frame>
        <frame
          style="inside_shallow_frame"
          styleMod={{
            horizontally_stretchable: true,
          }}
        >
          <SaveButtons assembly={this.assembly} />
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

export function openAssemblyManager(player: LuaPlayer, assembly: Assembly): void {
  const existingWindow = openedAssemblies[player.index].get(assembly)
  if (existingWindow) {
    if (!existingWindow.element.valid) {
      // should not happen...
      openedAssemblies[player.index].delete(assembly)
    } else {
      existingWindow.element.bring_to_front()
      return
    }
  }
  render(player.gui.screen, <AssemblyManager assembly={assembly} />)
}
