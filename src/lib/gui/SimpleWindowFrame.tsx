import { FactorioJsx, Spec, SpecChildren } from "../factoriojsx"
import { TitleBar } from "./TitleBar"

export function SimpleWindowFrame(props: {
  title: LocalisedString
  children: SpecChildren
  auto_center?: boolean
}): Spec {
  return (
    <frame auto_center={props.auto_center} direction="vertical">
      <TitleBar title={props.title} closesParent />
      <frame style="inside_shallow_frame_with_padding">{props.children}</frame>
    </frame>
  )
}
