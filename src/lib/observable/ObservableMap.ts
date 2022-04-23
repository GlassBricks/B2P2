import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface ObservableMapChange<K extends AnyNotNil, V> {
  map: ObservableMap<K, V>
  key: K
  oldValue: V | undefined
  value: V | undefined
}

@Classes.register()
export class ObservableMap<K extends AnyNotNil, V> extends BroadcastingObservable<ObservableMapChange<K, V>> {
  private map = new LuaMap<K, V | undefined>()
  private _size = 0

  public size(): number {
    return this._size
  }

  public set(key: K, value: V | undefined): void {
    const { map } = this
    const oldValue = map.get(key)
    if (oldValue !== value) {
      if (oldValue === undefined) {
        this._size++
      } else if (value === undefined) {
        this._size--
      }
      map.set(key, value)
      super.next({ map: this, key, oldValue, value })
    }
  }

  public has(key: K): boolean {
    return this.map.has(key)
  }

  public delete(key: K): void {
    this.set(key, undefined!)
  }

  public value(): LuaMap<K, V | undefined> {
    return this.map
  }
}
