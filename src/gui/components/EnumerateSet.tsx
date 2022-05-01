import { bound, Classes, Func, reg } from "../../lib"
import { Component, destroy, ElemProps, FactorioJsx, render, Spec, Tracker } from "../../lib/factoriojsx"
import { ObservableSet, ObservableSetChange } from "../../lib/observable/ObservableSet"
import { Unsubscribe } from "../../lib/observable"

export type EnumerateSetProps<T, U extends GuiElementType> = {
  uses: U
  of: ObservableSet<T>
  map: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>
} & ElemProps<U>
@Classes.register()
export class EnumerateSet<T, U extends GuiElementType> extends Component<EnumerateSetProps<T, U>> {
  of!: ObservableSet<T>
  map!: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>
  render(props: EnumerateSetProps<T, U>): Spec {
    this.of = props.of
    this.map = props.map
    this.ifEmpty = props.ifEmpty
    return <props.uses {...(props as any)} />
  }

  element!: BaseGuiElement
  associated = new LuaMap<T, BaseGuiElement>()

  onMount(element: BaseGuiElement, tracker: Tracker): void {
    this.element = element
    const { of, map, ifEmpty } = this
    if (of.size() === 0) {
      if (ifEmpty) {
        render(this.element, ifEmpty())
      }
    } else {
      const { associated } = this
      for (const [item] of of) {
        const result = render(this.element, map(item))
        if (result) {
          associated.set(item, result)
        }
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
      const result = render(element, map(value))
      if (result) {
        associated.set(value, result)
      }
    } else {
      const item = associated.get(value)
      destroy(item)
      if (ifEmpty && change.set.size() === 0) {
        render(element, ifEmpty())
      }
    }
  }
}
