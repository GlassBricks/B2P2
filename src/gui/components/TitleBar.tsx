import { FactorioJsx, Spec, SpecChildren } from "../../lib/factoriojsx"
import { MaybeObservable } from "../../lib/observable"

export function TitleBar(props: { title: MaybeObservable<LocalisedString>; children?: SpecChildren }): Spec {
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
      {/*<DraggableSpace />*/}
      <>{props.children}</>
    </flow>
  )
}

export function DraggableSpace(): Spec {
  return (
    <empty-widget
      ignored_by_interaction
      style="draggable_space"
      styleMod={{
        horizontally_stretchable: true,
        height: 24,
      }}
    />
  )
}
