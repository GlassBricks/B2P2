import { Observable, ObservableBrand, Observer } from "./Observable"
import { Callback } from "../references"
import Spy = spy.Spy

export class TestObservable<T> implements Observable<T> {
  public subscriber: Observer<T> | undefined
  public unsubscribeFn: Spy<Callback> = spy()

  constructor(public immediateValue?: T) {}

  subscribe(observer: Observer<T>): Callback {
    this.subscriber = observer
    if (this.immediateValue !== undefined) {
      observer(this.immediateValue)
    }
    return this.unsubscribeFn
  }

  fire(value: T): void {
    this.subscriber?.(value)
  }

  end(): void {
    this.subscriber?.(undefined, true)
  }

  declare [ObservableBrand]: true
}

TestObservable.prototype[ObservableBrand] = true
