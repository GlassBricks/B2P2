import { bound, Classes } from "../references"
import { Component, destroy, ElementInteractor, FactorioJsx, Props, render, Spec } from "../factoriojsx"
import { ObservableSet, ObservableSetChange } from "../observable/ObservableSet"

@Classes.register()
export class Enumerate<T> implements Component {
  declare props: {
    uses: "flow" | "scroll-pane"
    of: ObservableSet<T>
    map: (value: T) => Spec
    ifEmpty?: Spec
  } & Props<"flow" | "scroll-pane">

  render(): Spec {
    return <this.props.uses {...this.props} onCreate={(e) => this.setup(e)} />
  }

  element!: BaseGuiElement
  associated = new LuaMap<T, BaseGuiElement>()

  private setup(e: ElementInteractor<BaseGuiElement>) {
    const element = e.element
    this.element = element
    const { of, map, ifEmpty } = this.props
    if (of.size() === 0) {
      if (ifEmpty) {
        render(element, ifEmpty)
      }
    } else {
      for (const [item] of of) {
        this.associated.set(item, render(element, map(item)))
      }
    }
    e.addSubscription(of.subscribe({ next: this.onChange }))
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
