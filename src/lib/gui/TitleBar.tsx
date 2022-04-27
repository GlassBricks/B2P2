import { ClickEventHandler, destroy, FactorioJsx, Spec } from "../factoriojsx"
import { Functions } from "../references"
import { MaybeObservable } from "../observable"

const autoOnClose: ClickEventHandler = (e) => {
  const parent = e.element.parent!.parent
  if (parent) destroy(parent)
}
Functions.registerAll({ autoOnClose })

export function TitleBar(props: {
  title: MaybeObservable<LocalisedString>
  onClose?: ClickEventHandler
  closesParent?: boolean
}): Spec {
  if (props.closesParent && !props.onClose) {
    props.onClose = autoOnClose
  }
  return (
    <flow
      direction="horizontal"
      styleMod={{
        horizontal_spacing: 8,
        height: 28,
      }}
      onCreate={(element) => {
        if (element.parent!.type === "frame") element.drag_target = element.parent
      }}
      name="title_bar"
    >
      <label caption={props.title} style="frame_title" ignored_by_interaction />
      <empty-widget
        style="draggable_space"
        ignored_by_interaction={true}
        styleMod={{
          horizontally_stretchable: true,
          height: 24,
        }}
      />
      <CloseButton onClose={props.onClose} />
    </flow>
  )
}

export function CloseButton(props: { onClose?: ClickEventHandler }): Spec {
  return (
    <sprite-button
      style="frame_action_button"
      sprite="utility/close_white"
      hovered_sprite="utility/close_black"
      clicked_sprite="utility/close_black"
      tooltip={["gui.close"]}
      mouse_button_filter={["left"]}
      on_gui_click={props.onClose}
    />
  )
}
