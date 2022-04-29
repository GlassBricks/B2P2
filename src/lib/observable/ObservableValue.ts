import { bind, Classes } from "../references"
import { Observable, Observer, Subscription } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface ObservableValue<T> extends Observable<T> {
  readonly value: T
  get(): T
}

export interface MutableObservableValue<T> extends ObservableValue<T> {
  set(value: T): void

  end(): void

  setValueFn(value: T): (this: unknown) => void
}

export type State<T> = MutableObservableValue<T>

@Classes.register("State")
class ObservableValueImpl<T> extends BroadcastingObservable<T> implements MutableObservableValue<T> {
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

  private static setValueFn(this: { self: ObservableValueImpl<any>; value: unknown }) {
    this.self.set(this.value)
  }
  setValueFn(value: T): (this: unknown) => void {
    return bind(ObservableValueImpl.setValueFn, { self: this, value })
  }
}

export function observable<T>(value: T): MutableObservableValue<T> {
  return new ObservableValueImpl(value)
}

export type MaybeState<T> = MutableObservableValue<T> | T
