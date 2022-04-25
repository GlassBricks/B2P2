export const ObservableBrand: unique symbol = Symbol("Observable")

export interface Observable<T> {
  [ObservableBrand]: true
  subscribe(observer: Observer<T>): Subscription
}

export function isObservable<T>(obj: unknown): obj is Observable<T> {
  return typeof obj === "object" && (obj as any)[ObservableBrand] === true
}

export interface Observer<T> {
  // returns false means should unsubscribe
  next?(value: T): void | false
  end?(): void
}

export interface Subscription {
  unsubscribe(): void
}

export type MaybeObservable<T> = T | Observable<T>
export type Operator<T, R> = (source: Observable<T>) => Observable<R>

export function pipe<T, R>(source: Observable<T>, operator: Operator<T, R>): Observable<R>
export function pipe<T1, T2, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, R>,
): Observable<R>
export function pipe<T1, T2, T3, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, T6, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, T6>,
  operator6: Operator<T6, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, T6, T7, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, T6>,
  operator6: Operator<T6, T7>,
  operator7: Operator<T7, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, T6>,
  operator6: Operator<T6, T7>,
  operator7: Operator<T7, T8>,
  operator8: Operator<T8, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, T6>,
  operator6: Operator<T6, T7>,
  operator7: Operator<T7, T8>,
  operator8: Operator<T8, T9>,
  operator9: Operator<T9, R>,
): Observable<R>
export function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, R>(
  source: Observable<T1>,
  operator1: Operator<T1, T2>,
  operator2: Operator<T2, T3>,
  operator3: Operator<T3, T4>,
  operator4: Operator<T4, T5>,
  operator5: Operator<T5, T6>,
  operator6: Operator<T6, T7>,
  operator7: Operator<T7, T8>,
  operator8: Operator<T8, T9>,
  operator9: Operator<T9, T10>,
  operator10: Operator<T10, R>,
): Observable<R>
export function pipe(source: Observable<any>, ...operators: Operator<any, any>[]): Observable<any> {
  let result = source
  for (const operator of operators) {
    result = operator(result)
  }
  return result
}
