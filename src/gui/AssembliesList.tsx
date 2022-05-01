import { bind, bound, Classes, reg, returns } from "../lib"
import { Component, destroy, EmptyProps, FactorioJsx, Spec } from "../lib/factoriojsx"
import { Assembly } from "../assembly/Assembly"
import { GuiConstants, Styles } from "../constants"
import { L_Gui } from "../locale"
import { startAssemblyCreation } from "../assembly/creation"
import { DraggableSpace, TitleBar } from "./components/TitleBar"
import { EnumerateSet } from "./components/EnumerateSet"
import { addWindow } from "./window/Window"
import { openAssemblyManager } from "./assembly-manager/AssemblyManager"
import { CloseButton } from "./components/buttons"

@Classes.register()
export class AssembliesList extends Component {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(_props: EmptyProps): Spec {
    return (
      <frame
        auto_center
        direction="vertical"
        styleMod={{
          width: GuiConstants.AssembliesListWidth,
        }}
      >
        <TitleBar title={[L_Gui.AssemblyListTitle]}>
          <DraggableSpace />
          <CloseButton onClick={reg(this.close)} />
        </TitleBar>
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
              map={reg(this.assemblyButton)}
              ifEmpty={returns(<label caption={[L_Gui.NoAssemblies]} styleMod={{ height: 28, left_padding: 10 }} />)}
              uses="scroll-pane"
              direction="vertical"
              horizontal_scroll_policy="never"
              styleMod={{
                maximal_height: GuiConstants.AssembliesListMaxHeight,
                horizontally_stretchable: true,
                bottom_padding: -6,
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
        caption={assembly.displayName}
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
      openAssemblyManager(player, assembly)
    }
  }

  @bound
  private newAssembly(event: OnGuiClickEvent) {
    startAssemblyCreation(game.players[event.player_index])
  }

  element!: BaseGuiElement
  onMount(element: BaseGuiElement): void {
    this.element = element
  }

  @bound
  private close() {
    destroy(this.element)
  }
}

addWindow("assemblies-list", <AssembliesList />)
