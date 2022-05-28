import { Assembly } from "../../assembly/Assembly"
import { bound, Classes, reg, returns } from "../../lib"
import { ClickEventHandler, Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { state } from "../../lib/observable"
import { L_Gui } from "../../locale"
import { CloseButton } from "../components/buttons"
import { If } from "../components/If"
import { DraggableSpace, TitleBar } from "../components/TitleBar"

type AMTitleParProps = { assembly: Assembly; onClose: ClickEventHandler }
@Classes.register()
export class AMTitleBar extends Component<{ assembly: Assembly; onClose: ClickEventHandler }> {
  assembly!: Assembly
  isEditingName = state(false)

  render(props: AMTitleParProps): Spec {
    this.assembly = props.assembly

    return (
      <TitleBar title={[L_Gui.AssemblyManagerTitle]}>
        <If
          condition={this.isEditingName}
          then={reg(this.makeEditTextfield)}
          else={returns(<label caption={this.assembly.displayName} style="frame_title" ignored_by_interaction />)}
        />
        <RenameButton onClick={this.isEditingName.toggleFn()} />
        <DraggableSpace />
        <CloseButton onClick={props.onClose} />
      </TitleBar>
    )
  }

  @bound
  private makeEditTextfield(): Spec {
    return (
      <textfield
        text={this.assembly.name.get()}
        clear_and_focus_on_right_click
        on_gui_confirmed={reg(this.renameConfirmed)}
      />
    )
  }

  @bound
  private renameConfirmed(event: OnGuiConfirmedEvent) {
    const element = event.element as TextFieldGuiElement
    this.assembly.name.set(element.text.trim())
    this.isEditingName.set(false)
  }
}

function RenameButton(props: { onClick?: ClickEventHandler }): Spec {
  return (
    <sprite-button
      style="frame_action_button"
      sprite={"utility/rename_icon_small_white"}
      hovered_sprite={"utility/rename_icon_small_black"}
      clicked_sprite={"utility/rename_icon_small_black"}
      tooltip={[L_Gui.RenameAssembly]}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}
