import { FactorioJsx, Props, Spec } from "../factoriojsx"
import { TitleBar } from "./TitleBar"
import { MaybeObservable } from "../observable"

export function SimpleWindowFrame(
  props: Props<"frame"> & {
    title: MaybeObservable<LocalisedString>
  },
): Spec {
  return (
    <frame direction="vertical" {...props}>
      <TitleBar title={props.title} closesParent />
      <>{props.children}</>
    </frame>
  )
}
