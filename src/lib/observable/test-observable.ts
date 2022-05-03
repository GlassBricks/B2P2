import { Observable, Observer } from "./Observable"
import { Callback, Classes } from "../references"
import Spy = spy.Spy

@Classes.register()
export class TestObservable<T> extends Observable<T> {
  public subscriber: Observer<T> | undefined
  public unsubscribeFn: Spy<Callback> = spy()

  constructor(public immediateValue?: T) {
    super()
  }

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
}
