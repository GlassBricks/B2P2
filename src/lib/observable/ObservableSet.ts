import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface ObservableSetChange<T> {
  set: ObservableSet<T>
  value: T
  added?: true
}

@Classes.register()
export class ObservableSet<T> extends BroadcastingObservable<ObservableSetChange<T>> {
  private set = new LuaSet<T>()
  private _size = 0
  public add(value: T): void {
    const { set } = this
    if (!set.has(value)) {
      set.add(value)
      this._size++
      super.next({ set: this, value, added: true })
    }
  }

  public delete(value: T): void {
    const { set } = this
    if (set.has(value)) {
      set.delete(value)
      this._size--
      super.next({ set: this, value })
    }
  }

  public has(value: T): boolean {
    return this.value().has(value)
  }

  public value(): LuaSet<T> {
    return this.set
  }

  public size(): number {
    return this._size
  }
}
