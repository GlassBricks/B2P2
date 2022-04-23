import { Classes } from "../references"
import { Observable, Observer, Subscription } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface State<T> extends Observable<T> {
  get(): T
  set(value: T): void

  end(): void
}

@Classes.register("State")
class StateImpl<T> extends BroadcastingObservable<T> implements State<T> {
  public value: T
  public constructor(value: T) {
    super()
    this.value = value
  }

  subscribe(observer: Observer<T>): Subscription {
    observer.next?.(this.value)
    return super.subscribe(observer)
  }

  public set(value: T): void {
    this.value = value
    super.next(value)
  }

  public end(): void {
    super.end()
  }

  public get(): T {
    return this.value
  }
}

export function state<T>(value: T): State<T> {
  return new StateImpl(value)
}

export type MaybeState<T> = State<T> | T
