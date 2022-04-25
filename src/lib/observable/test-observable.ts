import { Observable, ObservableBrand, Observer, Subscription } from "./Observable"
import Spy = spy.Spy

export class TestObservable<T> implements Observable<T> {
  public subscriber: Observer<T> | undefined
  public unsubscribeFn: Spy<(this: unknown) => void> = spy()

  constructor(public immediateValue?: T) {}

  subscribe(observer: Observer<T>): Subscription {
    this.subscriber = observer
    if (this.immediateValue !== undefined) {
      observer.next?.(this.immediateValue)
    }
    return { unsubscribe: this.unsubscribeFn }
  }

  fire(value: T): void {
    this.subscriber?.next?.(value)
  }

  end(): void {
    this.subscriber?.end?.()
  }

  declare [ObservableBrand]: true
}

TestObservable.prototype[ObservableBrand] = true
