import { bind, Callback, Classes } from "../references"
import { MappedObservable, Mapper, Observable, Observer } from "./Observable"
import { BroadcastingObservable } from "./BroadcastingObservable"

/**
 * When states are subscribed to, the observer is immediately notified of the current state.
 */
export interface State<T> extends Observable<T> {
  get(): T

  map<V>(mapper: Mapper<T, V>): State<V>
}

export interface MutableState<T> extends State<T> {
  readonly value: T
  set(value: T): void

  end(): void

  setValueFn(value: T): Callback

  toggleFn(this: MutableState<boolean>): Callback
}

export type MaybeState<T> = State<T> | T

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

  map<V>(mapper: Mapper<T, V>): State<V> {
    return new MappedState(this, mapper)
  }
}

export function state<T>(value: T): MutableState<T> {
  return new StateImpl(value)
}

@Classes.register()
class MappedState<T, U> extends MappedObservable<T, U> implements State<U> {
  public constructor(source: State<T>, mapper: Mapper<T, U>) {
    super(source, mapper)
  }
  protected declare source: State<T>

  get(): U {
    return this.mapper(this.source.get())
  }

  map<V>(mapper: Mapper<U, V>): State<V> {
    return new MappedState(this, mapper)
  }
}

// possibly make lazy version of this in the future
