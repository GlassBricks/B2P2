import { bound, Classes, reg } from "../../lib"
import { Component, destroy, EmptyProps, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Assembly } from "../../assembly/Assembly"
import { L_Gui } from "../../locale"
import { startAssemblyCreation } from "../../assembly/assembly-creation"
import { DraggableSpace, TitleBar } from "../components/TitleBar"
import { addWindow } from "../window/Window"
import { openAssemblyManager } from "../assembly-manager/AssemblyManager"
import { CloseButton } from "../components/buttons"
import { AssembliesList } from "../AssembliesList"

@Classes.register()
export class AssembliesOverview extends Component<EmptyProps> {
  render(): Spec {
    return (
      <frame auto_center direction="vertical">
        <TitleBar title={[L_Gui.AssemblyOverviewTitle]}>
          <DraggableSpace />
          <CloseButton onClick={reg(this.close)} />
        </TitleBar>
        <frame style="inside_shallow_frame_with_padding">
          <flow
            direction="vertical"
            styleMod={{
              vertical_spacing: 5,
            }}
          >
            <label
              style="bold_label"
              caption={[L_Gui.AssemblyOverviewCaption]}
              tooltip={[L_Gui.AssemblyOverviewCaptionTooltip]}
            />
            <AssembliesList onSelect={reg(this.assemblyButtonClick)} />
            <flow direction="horizontal">
              <button caption={[L_Gui.NewAssembly]} on_gui_click={reg(this.newAssembly)} />
            </flow>
          </flow>
        </frame>
      </frame>
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

addWindow("assemblies-list", <AssembliesOverview />)
