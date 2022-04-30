import { bind, Callback, Classes } from "../references"
import { Observable, ObservableBrand, Observer, Unsubscribe } from "./Observable"

interface ObserverKey {
  _observerKeyBrand?: any
}
@Classes.register()
export class BroadcastingObservable<T> implements Observable<T> {
  private readonly observers = new LuaMap<ObserverKey, Observer<T>>()
  subscribe(observer: Observer<T>): Callback {
    const key: ObserverKey = {}
    const observers = this.observers
    observers.set(key, observer)
    return bind(BroadcastingObservable.unsubscribe, undefined, observers, key)
  }
  private static unsubscribe(observers: MutableLuaMap<ObserverKey, Observer<any>>, key: ObserverKey) {
    observers.delete(key)
  }

  protected next(value: T): void {
    for (const [key, observer] of this.observers) {
      if (observer(value) === Unsubscribe) {
        this.observers.delete(key)
      }
    }
  }

  protected end(): void {
    const observers = this.observers
    for (const [key, observer] of observers) {
      observer(undefined, true)
      observers.delete(key)
    }
  }
  declare [ObservableBrand]: true
}
BroadcastingObservable.prototype[ObservableBrand] = true
