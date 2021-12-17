export type START = 0
export type DATA = 1
export type END = 2

/** @noSelf */
export interface Source<T> {
  (type: START, sink: Sink<T>): void
}

/** @noSelf */
export interface Sink<T> {
  (type: START, talkback: Talkback): void
  (type: DATA, data: T): void
  (type: END, err?: unknown): void
}

export type CallbagMsg = START | DATA | END

/** @noSelf */
export interface Talkback {
  (type: DATA): void
  (type: END): void
}

export type TbMsg = DATA | END

/** @noSelf */
export interface PushSink<T> {
  (type: DATA, data: T): void
  (type: END, err?: unknown): void
}

export type PushMsg = DATA | END

/** @noSelf */
export interface SinkSource<T> {
  (type: START, sink: Sink<T>): void
  (type: DATA, data: T): void
  (type: END, err?: unknown): void
}

export type MaybeSource<T> = T | Source<T>
