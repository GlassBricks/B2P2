export type START = 0
export type DATA = 1
export type END = 2

export interface Source<T> {
  (type: START, observer: Sink<T>): void
}

export interface Sink<T> {
  (type: START, talkback: Talkback): void
  (type: DATA, data: T): void
  (type: END, err?: unknown): void
}

export interface Talkback {
  (type: DATA): void
  (type: END): void
}
