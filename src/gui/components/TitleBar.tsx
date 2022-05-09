import { funcRef, Functions } from "../../lib"
import { destroy, FactorioJsx, Spec, SpecChildren } from "../../lib/factoriojsx"
import { MaybeObservable } from "../../lib/observable"
import { CloseButton } from "./buttons"

export function TitleBar(props: { title: MaybeObservable<LocalisedString>; children?: SpecChildren }): Spec {
  return (
    <flow
      direction="horizontal"
      styleMod={{
        horizontal_spacing: 8,
        height: 28,
      }}
      onCreate={(element) => {
        const parent = element.parent!
        if (parent.type === "frame" && parent.parent === element.gui.screen) element.drag_target = parent
      }}
      name="title_bar"
    >
      <label caption={props.title} style="frame_title" ignored_by_interaction />
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

export function closeParentParent(e: OnGuiClickEvent): void {
  const parent = e.element.parent!.parent!
  if (parent.type === "frame") destroy(parent)
}
Functions.registerAll({ closeParentParent })

export function SimpleTitleBar(props: { title: MaybeObservable<LocalisedString> }): Spec {
  return (
    <TitleBar title={props.title}>
      <DraggableSpace />
      <CloseButton onClick={funcRef(closeParentParent)} />
    </TitleBar>
  )
}
