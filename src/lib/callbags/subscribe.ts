import { bind, Functions } from "../references"
import { DATA, END, Source, START, Talkback } from "./callbag"

/** @noSelf */
export interface Observer<T> {
  data?(this: void, value: T): void
  complete?(this: void): void
  error?(err: unknown): void
}

interface SinkInstance<T> extends Observer<T> {
  tb?: Talkback
}

function sink<T>(this: SinkInstance<T>, type: START | DATA | END, data?: any) {
  if (type === 0) {
    this.tb = data
  } else if (type === 1) {
    this.data?.(data)
  } else if (type === 2) {
    if (data !== undefined) {
      this.error?.(data)
    } else {
      this.complete?.()
    }
  }
}

Functions.register({ sink })

const subscribe =
  <T>(observer: Observer<T>) =>
  (source: Source<T>): Talkback => {
    const instance: SinkInstance<T> = { ...observer }
    source(0, bind(sink, instance))
    return instance.tb ?? error("no talkback received from source")
  }

export default subscribe
