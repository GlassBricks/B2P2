import { MutableState } from "../lib/observable"

export interface LayerOptions {
  readonly allowUpgrades: MutableState<boolean>
}
