import { teleportPlayerToArea } from "../area/teleport-history"
import { Assembly } from "../assembly/Assembly"
import { startAssemblyCreationFromEvent } from "../assembly/assembly-creation"
import { bound, Classes, funcRef, reg } from "../lib"
import { destroy, FactorioJsx, Spec } from "../lib/factoriojsx"
import { L_Gui } from "../locale"
import { AssembliesList } from "./AssembliesList"
import { openAssemblyManager } from "./assembly-manager"
import { CloseButton } from "./components/buttons"
import { closeParentParent, closeSelf, DraggableSpace, TitleBar } from "./components/TitleBar"
import { Window } from "./window/Window"

@Classes.register()
export class AssembliesOverview extends Window {
  render(): Spec {
    return (
      <frame auto_center direction="vertical" on_gui_closed={funcRef(closeSelf)}>
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
              <button caption={[L_Gui.NewAssembly]} on_gui_click={funcRef(startAssemblyCreationFromEvent)} />
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
      teleportPlayerToArea(player, assembly)
    } else {
      openAssemblyManager(player, assembly)
    }
  }

  element!: BaseGuiElement
  override onMount(element: BaseGuiElement): void {
    this.element = element
  }

  @bound
  private close() {
    destroy(this.element)
  }
}
