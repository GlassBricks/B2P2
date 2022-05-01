import { bound, Classes, Func, reg } from "../../lib"
import { Component, destroy, ElemProps, FactorioJsx, render, Spec, Tracker } from "../../lib/factoriojsx"
import { ObservableSet, ObservableSetChange } from "../../lib/observable/ObservableSet"
import { ObservableList, Unsubscribe } from "../../lib/observable"
import { ObservableListChange } from "../../lib/observable/ObservableList"
import { assertNever } from "../../lib/util"

@Classes.register()
export class EnumerateSet<T> extends Component {
  of!: ObservableSet<T>
  map!: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>
  render(
    props: {
      uses: "flow" | "scroll-pane"
      of: ObservableSet<T>
      map: Func<(value: T) => Spec>
      ifEmpty?: Func<() => Spec>
    } & ElemProps<"flow" | "scroll-pane">,
  ): Spec {
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

@Classes.register()
export class List<T> extends Component {
  of!: ObservableList<T>
  map!: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>

  element!: BaseGuiElement
  render(
    props: {
      uses: "flow" | "scroll-pane"
      of: ObservableList<T>
      map: Func<(value: T) => Spec>
      ifEmpty?: Func<() => Spec>
    } & ElemProps<"flow" | "scroll-pane">,
    tracker: Tracker,
  ): Spec {
    this.of = props.of
    this.map = props.map
    this.ifEmpty = props.ifEmpty
    tracker.onMount((element) => {
      this.element = element
      const { of, map, ifEmpty } = this
      if (of.length() === 0) {
        if (ifEmpty) {
          render(this.element, ifEmpty())
        }
      } else {
        for (const item of of.value()) {
          const result = render(this.element, map(item))
          if (!result) {
            //placeholder
            render(this.element, <empty-widget />)
          }
        }
      }
      const unsubscribe = of.subscribe(reg(this.onChange))
      tracker.onDestroy(unsubscribe)
    })

    return <props.uses {...(props as any)} />
  }

  private add(value: T, index: number) {
    if (!render(this.element, this.map(value), index + 1)) {
      render(this.element, <empty-widget />, index + 1)
    }
  }
  private remove(index: number) {
    destroy(this.element.children[index])
  }

  @bound
  private onChange(change?: ObservableListChange<T>) {
    if (!change) return
    const { ifEmpty, element } = this
    if (!element.valid) return Unsubscribe
    const array = change.array

    const changeType = change.type
    if (changeType === "add") {
      if (ifEmpty && array.length() === 1) {
        element.clear()
      }
      this.add(change.value, change.index)
    } else if (changeType === "remove") {
      this.remove(change.index)
      if (ifEmpty && array.length() === 0) {
        render(element, ifEmpty())
      }
    } else if (changeType === "set") {
      this.remove(change.index)
      this.add(change.value, change.index)
    } else if (changeType === "swap") {
      this.element.swap_children(change.indexA + 1, change.indexB + 1)
    } else {
      assertNever(changeType)
    }
  }
}
