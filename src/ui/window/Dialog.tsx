import { Component, destroy, FactorioJsx, GuiEvent, render, Spec } from "../../lib/factoriojsx"
import { bound, Classes, Events, Func, PlayerData, reg } from "../../lib"
import { L_Interaction } from "../../locale"

export interface DialogueProps {
  title: LocalisedString
  message: LocalisedString

  backCaption?: LocalisedString
  onBack?: Func<(player: LuaPlayer) => void>

  confirmCaption?: LocalisedString
  onConfirm?: Func<(player: LuaPlayer) => void>

  redConfirm?: boolean

  draggable?: boolean
  confirmShortcut?: boolean
}

@Classes.register()
class Dialog extends Component<
  DialogueProps & {
    translated: string
  }
> {
  private element!: FrameGuiElementMembers

  private onBackFn?: (data: any) => void
  private onConfirmFn?: (data: any) => void
  private redConfirm?: boolean

  render(props: DialogueProps & { translated: string }): Spec {
    assert(props.backCaption || props.confirmCaption, "Dialog requires at least one button")

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
        onCreate={(e) => (this.element = e)}
        on_gui_closed={reg(this.onClose)}
      >
        <text-box text={props.translated} style="notice_textbox" ignored_by_interaction />
        <flow style="dialog_buttons_horizontal_flow">
          {props.backCaption !== undefined && (
            <button style="back_button" caption={props.backCaption} on_gui_click={reg(this.onBack)} />
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
              on_gui_click={reg(this.onConfirm)}
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

const pendingDialogue = PlayerData<DialogueProps>("pendingDialogue")

export function showDialogue(player: LuaPlayer, props: DialogueProps): void {
  pendingDialogue[player.index] = props
  player.request_translation([L_Interaction.TranslateDialogueMessage, props.message])
}
Events.on_string_translated((e) => {
  const string = e.localised_string
  if (typeof string !== "object" || string[0] !== L_Interaction.TranslateDialogueMessage) return
  const playerIndex = e.player_index
  const props = pendingDialogue[playerIndex]
  if (!props) return
  delete pendingDialogue[playerIndex]
  const player = game.players[playerIndex]
  player.opened = render(player.gui.screen, <Dialog {...props} translated={e.result} />)
})
