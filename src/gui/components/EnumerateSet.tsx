import { bound, Classes, reg } from "../../lib"
import { Component, destroy, FactorioJsx, Props, render, Spec, Tracker } from "../../lib/factoriojsx"
import { ObservableSet, ObservableSetChange } from "../../lib/observable/ObservableSet"
import { Unsubscribe } from "../../lib/observable"

@Classes.register()
export class EnumerateSet<T> extends Component {
  of!: ObservableSet<T>
  map!: (value: T) => Spec
  ifEmpty?: () => Spec
  render(
    props: {
      uses: "flow" | "scroll-pane"
      of: ObservableSet<T>
      map: (value: T) => Spec
      ifEmpty?: () => Spec
    } & Props<"flow" | "scroll-pane">,
    tracker: Tracker,
  ): Spec {
    this.of = props.of
    this.map = props.map
    this.ifEmpty = props.ifEmpty
    return <props.uses {...props} onCreate={this.setup.bind(this, tracker)} />
  }

  element!: BaseGuiElement
  associated = new LuaMap<T, BaseGuiElement>()

  private setup(tracker: Tracker, element: BaseGuiElement) {
    this.element = element
    const { of, map, ifEmpty } = this
    if (of.size() === 0) {
      if (ifEmpty) {
        render(element, ifEmpty())
      }
    } else {
      const { associated } = this
      for (const [item] of of) {
        associated.set(item, render(element, map(item)))
      }
    }
    const unsubscribe = of.subscribe(reg(this.onChange))
    tracker.onDestroy(unsubscribe)
  }

  @bound
  private onChange(change?: ObservableSetChange<T>) {
    if (!change) return
    const { map, ifEmpty, associated, element } = this
    if (!element.valid) return Unsubscribe
    const { value, added } = change
    if (added) {
      if (ifEmpty && change.set.size() === 1) {
        element.clear()
      }
      associated.set(value, render(element, map(value)))
    } else {
      const item = associated.get(value)
      destroy(item)
      if (ifEmpty && change.set.size() === 0) {
        render(element, ifEmpty())
      }
    }
  }
}
