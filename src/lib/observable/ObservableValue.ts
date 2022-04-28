import { Classes } from "../references"
import { Observable, Observer, Subscription } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface ObservableValue<T> extends Observable<T> {
  readonly value: T
  get(): T
  set(value: T): void

  end(): void
}

@Classes.register("State")
class ObservableValueImpl<T> extends BroadcastingObservable<T> implements ObservableValue<T> {
  public value: T
  public constructor(value: T) {
    super()
    this.value = value
  }

  subscribe(observer: Observer<T>): Subscription {
    observer.next?.(this.value)
    return super.subscribe(observer)
  }

  get(): T {
    return this.value
  }

  public set(value: T): void {
    this.value = value
    super.next(value)
  }

  public end(): void {
    super.end()
  }
}

export function observable<T>(value: T): ObservableValue<T> {
  return new ObservableValueImpl(value)
}

export type MaybeState<T> = ObservableValue<T> | T
