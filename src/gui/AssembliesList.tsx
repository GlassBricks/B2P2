import { bind, bound, Classes, reg, returns } from "../lib"
import { EmptyComponent, FactorioJsx, Spec } from "../lib/factoriojsx"
import { Assembly } from "../assembly/Assembly"
import { GuiParameters, Styles } from "../constants"
import { L_Gui } from "../locale"
import { startAssemblyCreation } from "../assembly/creation"
import { TitleBar } from "./components/TitleBar"
import { EnumerateSet } from "./components/EnumerateSet"
import { addWindow } from "./window/Window"
import { openAssemblyManager } from "./assembly-manager/AssemblyManager"

@Classes.register()
export class AssembliesList extends EmptyComponent {
  render(): Spec {
    return (
      <frame
        auto_center
        direction="vertical"
        styleMod={{
          width: GuiParameters.AssembliesListWidth,
        }}
      >
        <TitleBar title={[L_Gui.AssemblyListTitle]} closesParent />
        <frame style="inside_shallow_frame_with_padding" direction="vertical">
          <label
            style="bold_label"
            caption={[L_Gui.AssemblyListCaption]}
            tooltip={[L_Gui.AssemblyListCaptionTooltip]}
          />
          <frame
            style="deep_frame_in_shallow_frame"
            direction="vertical"
            styleMod={{
              margin: [5, 0],
            }}
          >
            <EnumerateSet
              of={Assembly.getAllAssemblies()}
              map={this.assemblyButton}
              ifEmpty={returns(<label caption={[L_Gui.NoAssemblies]} styleMod={{ margin: 5 }} />)}
              uses="scroll-pane"
              direction="vertical"
              horizontal_scroll_policy="never"
              styleMod={{
                maximal_height: GuiParameters.AssembliesListMaxHeight,
                horizontally_stretchable: true,
              }}
            />
          </frame>
          <flow direction="horizontal">
            <button caption={[L_Gui.NewAssembly]} on_gui_click={reg(this.newAssembly)} />
          </flow>
        </frame>
      </frame>
    )
  }
  @bound
  private assemblyButton(assembly: Assembly) {
    return (
      <button
        caption={assembly.name}
        style={Styles.ListBoxButton}
        styleMod={{
          bottom_margin: -4,
        }}
        on_gui_click={bind(this.assemblyButtonClick, this, assembly)}
      />
    )
  }

  @bound
  private assemblyButtonClick(assembly: Assembly, event: OnGuiClickEvent) {
    const player = game.players[event.player_index]
    if (event.control) {
      // teleport player
      assembly.teleportPlayer(player)
    } else {
      player.print("TODO: gui for assembly")
    }
  }

  @bound
  private newAssembly(event: OnGuiClickEvent) {
    startAssemblyCreation(game.players[event.player_index])
  }
}

addWindow("assemblies-list", <AssembliesList />)
