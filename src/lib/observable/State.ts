import { bind, Callback, Classes } from "../references"
import { Observable, Observer } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface State<T> extends Observable<T> {
  readonly value: T
  get(): T
}

export interface MutableState<T> extends State<T> {
  set(value: T): void

  end(): void

  setValueFn(value: T): Callback

  toggleFn(this: MutableState<boolean>): Callback
}

@Classes.register("State")
class StateImpl<T> extends BroadcastingObservable<T> implements MutableState<T> {
  public value: T
  public constructor(value: T) {
    super()
    this.value = value
  }

  subscribe(observer: Observer<T>): Callback {
    observer(this.value)
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

  private static setValueFn(this: StateImpl<any>, value: unknown) {
    this.set(value)
  }
  setValueFn(value: T): Callback {
    return bind(StateImpl.setValueFn, this, value)
  }
  private static toggleFn(this: MutableState<boolean>) {
    this.set(!this.value)
  }
  toggleFn(this: MutableState<boolean>): Callback {
    return bind(StateImpl.toggleFn, this)
  }
}

export function observable<T>(value: T): MutableState<T> {
  return new StateImpl(value)
}

export type MaybeState<T> = State<T> | T
