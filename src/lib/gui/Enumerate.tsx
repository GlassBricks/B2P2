import { bound, Classes } from "../references"
import { Component, destroy, FactorioJsx, render, Spec } from "../factoriojsx"
import { ObservableSet, ObservableSetChange } from "../observable/ObservableSet"

@Classes.register()
export class Enumerate<T> implements Component {
  declare props: {
    direction?: "horizontal" | "vertical"
    set: ObservableSet<T>
    map: (this: void, value: T) => Spec
  }

  element!: FlowGuiElementMembers
  associated = new Map<T, BaseGuiElement>()

  private setup(e: FlowGuiElementMembers) {
    this.element = e
    const { set, map } = this.props
    for (const [element] of set) {
      this.associated.set(element, render(e, map(element)))
    }
    set.subscribe({ next: this.onChange })
  }

  @bound
  private onChange(change: ObservableSetChange<T>) {
    const { value } = change
    if (change.added) {
      this.associated.set(value, render(this.element, this.props.map(value)))
    } else {
      const element = this.associated.get(value)
      destroy(element)
    }
  }

  render(): Spec {
    return <flow direction={this.props.direction} onCreate={(e) => this.setup(e)} />
  }
}
