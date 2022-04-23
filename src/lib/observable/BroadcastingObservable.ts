import { Classes } from "../references"
import { Observable, ObservableBrand, Observer, Subscription } from "./Observable"

interface ObserverKey {
  _observerKeyBrand?: any
}
@Classes.register()
export class BroadcastingObservable<T> implements Observable<T> {
  private readonly observers = new LuaMap<ObserverKey, Observer<T>>()
  subscribe(observer: Observer<T>): Subscription {
    const key: ObserverKey = {}
    const observers = this.observers
    observers.set(key, observer)
    return new BroadcastingObservableSubscription(observers, key)
  }

  protected next(value: T): void {
    for (const [, observer] of this.observers) {
      observer.next?.(value)
    }
  }

  protected end(): void {
    const observers = this.observers
    for (const [key, observer] of observers) {
      observer.end?.()
      observers.delete(key)
    }
  }
  declare [ObservableBrand]: true
}

BroadcastingObservable.prototype[ObservableBrand] = true

@Classes.register()
class BroadcastingObservableSubscription implements Subscription {
  constructor(private observers: MutableLuaMap<ObserverKey, Observer<any>>, private key: ObserverKey) {}
  unsubscribe(): void {
    this.observers.delete(this.key)
  }
}
