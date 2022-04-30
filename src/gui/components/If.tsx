// this could maybe be moved to shared lib in the future

import { bound, Classes } from "../../lib"
import { Component, FactorioJsx, Props, render, Spec } from "../../lib/factoriojsx"
import { State } from "../../lib/observable"

// todo: fix
@Classes.register()
export class If extends Component {
  then!: () => Spec | undefined
  else?: () => Spec | undefined
  element!: FlowGuiElementMembers

  render(
    props: {
      condition: State<boolean>
      then: () => Spec | undefined
      else?: () => Spec | undefined
    } & Props<"flow">,
  ): Spec {
    this.then = props.then
    this.else = props.else
    return (
      <flow
        {...props}
        onCreate={(element) => {
          this.element = element
          this.onChange(props.condition.value)
          const subscription = props.condition.subscribe(this.onChange)
          // interactor.addSubscription(subscription)
        }}
      />
    )
  }

  lastValue: boolean | undefined
  @bound
  private onChange(value?: boolean, end?: boolean) {
    if (end) return
    if (value === this.lastValue) return
    this.lastValue = value
    this.element.clear()
    const spec = value ? this.then() : this.else?.()
    if (spec) {
      render(this.element, spec)
    }
  }
}
