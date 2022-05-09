import { bind, Callback, Classes, Func, funcRef } from "../references"

declare const ObservableBrand: unique symbol

export abstract class Observable<T> {
  declare [ObservableBrand]: true
  abstract subscribe(observer: Observer<T>): Callback

  map<V>(mapper: Mapper<T, V>): Observable<V> {
    return new MappedObservable(this, mapper)
  }

  choice<V>(this: Observable<boolean>, whenTrue: V, whenFalse: V): Observable<V> {
    return this.map(bind(Observable.choiceFn, undefined, whenTrue, whenFalse))
  }
  static choiceFn<V>(whenTrue: V, whenFalse: V, value: boolean): V {
    return value ? whenTrue : whenFalse
  }
  truthy(): Observable<boolean> {
    return this.map(funcRef(Observable.truthyFn))
  }
  static truthyFn<V>(this: void, value: V): boolean {
    return !!value
  }
}

@Classes.register()
export class MappedObservable<T, U> extends Observable<U> {
  private static mappedObserver(this: Observer<any>, mapper: Mapper<any, any>, value: unknown) {
    this(mapper(value))
  }
  constructor(protected readonly source: Observable<T>, protected readonly mapper: Mapper<T, U>) {
    super()
  }

  subscribe(observer: Observer<U>): Callback {
    return this.source.subscribe(bind(MappedObservable.mappedObserver, observer, this.mapper))
  }
}

export type Mapper<T, U> = Func<(value: T) => U>

export function isObservable(obj: unknown): obj is Observable<any> {
  return obj instanceof Observable
}

export const Unsubscribe: unique symbol = Symbol("EndSubscription")

export interface Observer<T> {
  (this: unknown, value: T): void | typeof Unsubscribe
}

export type MaybeObservable<T> = T | Observable<T>
