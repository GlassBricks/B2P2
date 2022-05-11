import { Assembly } from "../../assembly/Assembly"
import { bound, Classes, reg, returns } from "../../lib"
import { ClickEventHandler, Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { State, state } from "../../lib/observable"
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
        <RenameButton onClick={this.isEditingName.toggleFn()} isEditing={this.isEditingName} />
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

function RenameButton(props: { onClick?: ClickEventHandler; isEditing: State<boolean> }): Spec {
  // when editing, should resemble close button and have "cancel rename" tooltip
  const { isEditing } = props
  const sprite = isEditing.switch("utility/close_white", "utility/rename_icon_small_white")
  const tooltip = isEditing.switch<LocalisedString>([L_Gui.CancelRenameAssembly], [L_Gui.RenameAssembly])
  const hoveredSprite = isEditing.switch("utility/close_black", "utility/rename_icon_small_black")
  return (
    <sprite-button
      style="frame_action_button"
      sprite={sprite}
      hovered_sprite={hoveredSprite}
      clicked_sprite={hoveredSprite}
      tooltip={tooltip}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}
