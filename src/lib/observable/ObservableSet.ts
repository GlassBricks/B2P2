import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"
import { Observable } from "./Observable"

export interface ObservableSetChange<T> {
  set: ObservableSet<T>
  value: T
  added?: true
}

export interface ObservableSet<T> extends Observable<ObservableSetChange<T>>, LuaPairsIterable<T, true> {
  size(): number
  has(value: T): boolean
  value(): LuaSet<T>
}

export interface MutableObservableSet<T> extends ObservableSet<T> {
  add(value: T): void
  delete(value: T): void
}

export function observableSet<T>(): MutableObservableSet<T> {
  return new ObservableSetImpl()
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ObservableSetImpl<T> extends LuaPairsIterable<T, true> {}

@Classes.register()
class ObservableSetImpl<T> extends BroadcastingObservable<ObservableSetChange<T>> implements MutableObservableSet<T> {
  private set = new LuaSet<T>()
  private _size = 0

  public has(value: T): boolean {
    return this.value().has(value)
  }

  public value(): LuaSet<T> {
    return this.set
  }

  public size(): number {
    return this._size
  }

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

  __pairs() {
    return pairs(this.set)
  }
}
