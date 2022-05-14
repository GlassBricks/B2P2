import { Sprites } from "../../constants"
import { ClickEventHandler, FactorioJsx, Spec } from "../../lib/factoriojsx"

export function CloseButton(props: { tooltip?: LocalisedString; onClick?: ClickEventHandler }): Spec {
  return (
    <sprite-button
      style="frame_action_button"
      sprite="utility/close_white"
      hovered_sprite="utility/close_black"
      clicked_sprite="utility/close_black"
      tooltip={props.tooltip ?? ["gui.close"]}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}

export function TeleportButton(props: { tooltip?: LocalisedString; onClick?: ClickEventHandler }): Spec {
  return (
    <sprite-button
      style={"tool_button"}
      sprite={Sprites.TeleportBlack}
      tooltip={props.tooltip}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}

export function TrashButton(props: { onClick?: ClickEventHandler; tooltip?: LocalisedString }): Spec {
  return (
    <sprite-button
      style="tool_button_red"
      sprite={"utility/trash"}
      tooltip={props.tooltip}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}

export function DotDotDotButton(props: { onClick?: ClickEventHandler; tooltip?: LocalisedString }): Spec {
  return (
    <button
      style="tool_button"
      tooltip={props.tooltip}
      caption="..."
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}
