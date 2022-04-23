import { Classes } from "../references"
import { Observer, Subscription } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

@Classes.register()
export class State<T> extends BroadcastingObservable<T> {
  public state: T
  public constructor(value: T) {
    super()
    this.state = value
  }

  subscribe(observer: Observer<T>): Subscription {
    observer.next?.(this.state)
    return super.subscribe(observer)
  }

  public set(value: T): void {
    this.state = value
    super.next(value)
  }

  public end(): void {
    super.end()
  }

  public get(): T {
    return this.state
  }
}
