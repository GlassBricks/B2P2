import { Component, destroy, FactorioJsx, render, Spec } from "../../lib/factoriojsx"
import { bound, Classes } from "../../lib"

export interface DialogueProps {
  title: LocalisedString
  content: Spec

  backCaption?: LocalisedString
  onBack?: () => void

  confirmCaption?: LocalisedString
  onConfirm?: () => void

  redConfirm?: boolean

  draggable?: boolean
  confirmShortcut?: boolean
}

@Classes.register()
class Dialogue implements Component {
  declare props: DialogueProps

  private element!: FrameGuiElementMembers

  render(): Spec {
    const props = this.props
    assert(props.backCaption || props.confirmCaption, "Dialogue requires at least one button")

    return (
      <frame
        auto_center
        caption={props.title}
        styleMod={{
          use_header_filler: true,
        }}
        direction={"vertical"}
        onCreate={(e) => {
          this.element = e
        }}
        on_gui_closed={this.onClose}
      >
        {props.content}
        <flow style="dialog_buttons_horizontal_flow">
          {props.backCaption !== undefined && (
            <button style="back_button" caption={props.backCaption} on_gui_click={this.onBack} />
          )}
          <empty-widget
            style="draggable_space"
            styleMod={{ horizontally_stretchable: true }}
            onCreate={(e) => {
              e.drag_target = e.parent!.parent
            }}
          />
          {props.confirmCaption !== undefined && (
            <button
              style={props.redConfirm ? "red_confirm_button" : "confirm_button"}
              caption={props.confirmCaption}
              on_gui_click={this.onConfirm}
            />
          )}
        </flow>
      </frame>
    )
  }

  @bound
  private onBack() {
    this.props.onBack?.()
    destroy(this.element)
  }

  @bound
  private onConfirm() {
    this.props.onConfirm?.()
    destroy(this.element)
  }

  @bound
  private onClose() {
    const props = this.props
    if (props.redConfirm) {
      props.onBack?.()
    } else {
      props.onConfirm?.()
    }
    destroy(this.element)
  }
}

export function showDialogue(player: LuaPlayer, props: DialogueProps): void {
  player.opened = render(player.gui.screen, <Dialogue {...props} />)
}
