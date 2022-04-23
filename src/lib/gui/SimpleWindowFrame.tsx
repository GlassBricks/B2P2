import { FactorioJsx, Props, Spec } from "../factoriojsx"
import { TitleBar } from "./TitleBar"
import { MaybeObservable } from "../observable"

export function SimpleWindowFrame(
  props: Props<"frame"> & {
    title: MaybeObservable<LocalisedString>
  },
): Spec {
  return (
    <frame auto_center={props.auto_center} direction="vertical">
      <TitleBar title={props.title} closesParent />
      <frame style="inside_shallow_frame_with_padding">{props.children}</frame>
    </frame>
  )
}
