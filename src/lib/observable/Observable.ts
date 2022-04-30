import { Callback } from "../references"

export const ObservableBrand: unique symbol = Symbol("Observable")

export interface Observable<T> {
  [ObservableBrand]: true
  subscribe(observer: Observer<T>): Callback
}

export function isObservable<T>(obj: unknown): obj is Observable<T> {
  return typeof obj === "object" && ObservableBrand in obj!
}

export const Unsubscribe: unique symbol = Symbol("EndSubscription")

export interface Observer<T> {
  (this: unknown, value: T, end?: never): void | typeof Unsubscribe
  (this: unknown, value: undefined, end: true): void
}

export type MaybeObservable<T> = T | Observable<T>
