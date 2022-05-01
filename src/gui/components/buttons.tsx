import { ClickEventHandler, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Sprites } from "../../constants"

export function CloseButton(props: { onClick?: ClickEventHandler }): Spec {
  return (
    <sprite-button
      style="frame_action_button"
      sprite="utility/close_white"
      hovered_sprite="utility/close_black"
      clicked_sprite="utility/close_black"
      tooltip={["gui.close"]}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}

export function TeleportButton(props: { onClick?: ClickEventHandler; tooltip?: LocalisedString }): Spec {
  return (
    <sprite-button
      style="frame_action_button"
      sprite={Sprites.TeleportWhite}
      hovered_sprite={Sprites.TeleportBlack}
      clicked_sprite={Sprites.TeleportBlack}
      tooltip={props.tooltip}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClick}
    />
  )
}
