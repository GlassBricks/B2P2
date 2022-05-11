import { bound, Classes, funcRef, reg } from "../../lib"
import { destroy, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Assembly } from "../../assembly/Assembly"
import { L_Gui } from "../../locale"
import { startAssemblyCreation } from "../../assembly/assembly-creation"
import { closeParentParent, DraggableSpace, TitleBar } from "../components/TitleBar"
import { Window } from "../window/Window"
import { CloseButton } from "../components/buttons"
import { AssembliesList } from "../AssembliesList"
import { teleportPlayer } from "../../assembly/AreaIdentification"
import { openAssemblyManager } from "../assembly-manager"

@Classes.register()
export class AssembliesOverview extends Window {
  render(): Spec {
    return (
      <frame auto_center direction="vertical">
        <TitleBar title={[L_Gui.AssemblyOverviewTitle]}>
          <DraggableSpace />
          <CloseButton onClick={funcRef(closeParentParent)} />
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
      teleportPlayer(player, assembly)
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
