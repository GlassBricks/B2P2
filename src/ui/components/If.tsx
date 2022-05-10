// this could maybe be moved to shared lib in the future

import { bound, Classes, reg } from "../../lib"
import {
  Component,
  destroyChildren,
  ElemProps,
  FactorioJsx,
  renderMultiple,
  Spec,
  Tracker,
} from "../../lib/factoriojsx"
import { State } from "../../lib/observable"

export type IfProps = {
  condition: State<boolean>
  then: () => Spec | undefined
  else?: () => Spec | undefined
} & ElemProps<"flow">

@Classes.register()
export class If extends Component<IfProps> {
  then!: () => Spec | undefined
  else?: () => Spec | undefined
  element!: FlowGuiElementMembers

  render(props: IfProps, tracker: Tracker): Spec {
    this.then = props.then
    this.else = props.else
    return (
      <flow
        {...props}
        onCreate={(element) => {
          this.element = element
          const unsubscribe = props.condition.subscribeAndFire(reg(this.onChange))
          tracker.onDestroy(unsubscribe)
        }}
      />
    )
  }

  @bound
  private onChange(value: boolean) {
    destroyChildren(this.element)
    const spec = value ? this.then() : this.else?.()
    if (spec) {
      renderMultiple(this.element, spec)
    }
  }
}
