import { ClickEventHandler, FactorioJsx, Spec } from "../../lib/factoriojsx"

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
