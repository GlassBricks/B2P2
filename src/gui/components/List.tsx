import { bound, Classes, Func, reg } from "../../lib"
import {
  Component,
  destroy,
  destroyChildren,
  ElemProps,
  FactorioJsx,
  render,
  Spec,
  Tracker,
} from "../../lib/factoriojsx"
import { ObservableList, Unsubscribe } from "../../lib/observable"
import { ObservableListChange } from "../../lib/observable/ObservableList"
import { assertNever } from "../../lib/util"

export type ListProps<T, U extends GuiElementType> = {
  uses: U
  of: ObservableList<T>
  map: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>
} & ElemProps<U>
@Classes.register()
export class List<T, U extends GuiElementType> extends Component<ListProps<T, U>> {
  map!: Func<(value: T) => Spec>
  ifEmpty?: Func<() => Spec>

  element!: BaseGuiElement

  render(props: ListProps<T, U>, tracker: Tracker): Spec {
    this.map = props.map
    this.ifEmpty = props.ifEmpty
    tracker.onMount((element) => {
      this.element = element
      const { of, map, ifEmpty } = props
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
        destroyChildren(element)
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
