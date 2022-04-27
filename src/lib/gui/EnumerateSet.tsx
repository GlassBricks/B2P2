import { bound, Classes } from "../references"
import { Component, destroy, ElementInteractor, FactorioJsx, Props, render, Spec } from "../factoriojsx"
import { ObservableSet, ObservableSetChange } from "../observable/ObservableSet"

@Classes.register()
export class EnumerateSet<T> implements Component {
  declare props: {
    uses: "flow" | "scroll-pane"
    of: ObservableSet<T>
    map: (value: T) => Spec
    ifEmpty?: Spec
  } & Props<"flow" | "scroll-pane">

  render(): Spec {
    return <this.props.uses {...this.props} onCreate={this.setup.bind(this)} />
  }

  element!: BaseGuiElement
  associated = new LuaMap<T, BaseGuiElement>()

  private setup(element: BaseGuiElement, interactor: ElementInteractor) {
    this.element = element
    const { of, map, ifEmpty } = this.props
    if (of.size() === 0) {
      if (ifEmpty) {
        render(element, ifEmpty)
      }
    } else {
      const { associated } = this
      for (const [item] of of) {
        associated.set(item, render(element, map(item)))
      }
    }
    interactor.addSubscription(of.subscribe({ next: this.onChange }))
  }

  @bound
  private onChange(change: ObservableSetChange<T>) {
    const { props, associated, element } = this
    if (!element.valid) return false
    const { value, added } = change
    if (added) {
      if (props.ifEmpty && change.set.size() === 1) {
        destroy(element.children[0])
      }
      associated.set(value, render(element, props.map(value)))
    } else {
      const item = associated.get(value)
      destroy(item)
      if (props.ifEmpty && change.set.size() === 0) {
        render(element, props.ifEmpty)
      }
    }
  }
}
