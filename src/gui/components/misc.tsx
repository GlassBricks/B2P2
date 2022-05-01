import { FactorioJsx, Spec } from "../../lib/factoriojsx"

export const HorizontalPusher = (): Spec => (
  <empty-widget
    styleMod={{
      horizontally_stretchable: true,
      horizontally_squashable: true,
    }}
  />
)

export const HorizontalSpacer = (props: { width: number }): Spec => (
  <empty-widget
    styleMod={{
      width: props.width,
      height: 0,
      horizontally_stretchable: false,
      horizontally_squashable: false,
    }}
  />
)
