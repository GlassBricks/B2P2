import { FactorioJsx, Spec } from "../../lib/factoriojsx"

export const HorizontalPusher = (): Spec => (
  <empty-widget
    styleMod={{
      horizontally_stretchable: true,
      horizontally_squashable: true,
    }}
  />
)
