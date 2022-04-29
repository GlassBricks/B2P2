import { Component, destroy, FactorioJsx, GuiEvent, render, Spec } from "../../lib/factoriojsx"
import { bound, Classes } from "../../lib"

export interface DialogueProps {
  title: LocalisedString
  content: Spec

  backCaption?: LocalisedString
  onBack?: (player: LuaPlayer) => void

  confirmCaption?: LocalisedString
  onConfirm?: (player: LuaPlayer) => void

  redConfirm?: boolean

  draggable?: boolean
  confirmShortcut?: boolean
}

@Classes.register()
class Dialogue extends Component {
  private element!: FrameGuiElementMembers

  private onBackFn?: (data: any) => void
  private onConfirmFn?: (data: any) => void
  private redConfirm?: boolean

  render(props: DialogueProps): Spec {
    assert(props.backCaption || props.confirmCaption, "Dialogue requires at least one button")

    this.onBackFn = props.onBack
    this.onConfirmFn = props.onConfirm
    this.redConfirm = props.redConfirm

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
  private onBack(e: GuiEvent) {
    this.onBackFn?.(game.players[e.player_index])
    destroy(this.element)
  }

  @bound
  private onConfirm(e: GuiEvent) {
    this.onConfirmFn?.(game.players[e.player_index])
    destroy(this.element)
  }

  @bound
  private onClose(e: OnGuiClosedEvent) {
    if (this.redConfirm) {
      this.onBack(e)
    } else {
      this.onConfirm(e)
    }
  }
}

export function showDialogue(player: LuaPlayer, props: DialogueProps): void {
  player.opened = render(player.gui.screen, <Dialogue {...props} />)
}
