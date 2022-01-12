export type START = 0
export type DATA = 1
export type END = 2

export interface Source<T> {
  (this: unknown, type: START, sink: Sink<T>): void
}

export interface Sink<T> {
  (this: unknown, type: START, talkback: Talkback): void
  (this: unknown, type: DATA, data: T): void
  (this: unknown, type: END, err?: unknown): void
}

export type CallbagMsg = START | DATA | END

export interface Talkback {
  (this: unknown, type: DATA): void
  (this: unknown, type: END): void
}

export type TbMsg = DATA | END

export interface PushSink<T> {
  (this: unknown, type: DATA, data: T): void
  (this: unknown, type: END, err?: unknown): void
}

export type PushMsg = DATA | END

export interface SinkSource<T> {
  (this: unknown, type: START, sink: Sink<T>): void
  (this: unknown, type: DATA, data: T): void
  (this: unknown, type: END, err?: unknown): void
}

export type MaybeSource<T> = T | Source<T>
export type MaybeSinkSource<T> = T | SinkSource<T>
