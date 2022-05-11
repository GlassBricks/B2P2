import { bound, Classes, Func, reg } from "../../lib"
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

export type FuncProps<T, U extends GuiElementType> = {
  uses: U
  from: State<T>
  map: Func<(value: T) => Spec>
} & ElemProps<U>

@Classes.register()
export class Fn<T, U extends GuiElementType> extends Component<FuncProps<T, U>> {
  map!: Func<(value: T) => Spec>

  element!: LuaGuiElement

  render(props: FuncProps<T, U>, tracker: Tracker): Spec {
    const { from, map } = props
    this.map = map
    tracker.onMount((element) => {
      this.element = element
      const unsub = from.subscribeAndFire(reg(this.onChange))
      tracker.onDestroy(unsub)
    })

    return <props.uses {...(props as any)} />
  }

  @bound
  onChange(value: T): void {
    const spec = this.map(value)
    destroyChildren(this.element)
    renderMultiple(this.element, spec)
  }
}
