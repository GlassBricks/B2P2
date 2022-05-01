import { FactorioJsx, Spec } from "../../lib/factoriojsx"

export const HorizontalPusher = (): Spec => (
  <empty-widget
    styleMod={{
      horizontally_stretchable: true,
    }}
  />
)

export const HorizontalSpacer = (props: { width: number }): Spec => (
  <empty-widget
    styleMod={{
      width: props.width,
    }}
  />
)
