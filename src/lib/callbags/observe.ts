import { bind, Functions } from "../references"
import { DATA, END, Source, START, Talkback } from "./callbag"

interface SinkInstance<T> {
  tb?: Talkback
  consumer: (this: void, item: T) => void
}

function sink<T>(this: SinkInstance<T>, type: START | DATA | END, data?: any) {
  if (type === 0) {
    this.tb = data
  } else if (type === 1) {
    this.consumer(data)
  }
}

Functions.register({ sink })

const observe =
  <T>(consumer: (item: T) => void) =>
  (source: Source<T>): Talkback => {
    const instance: SinkInstance<T> = { consumer }
    source(0, bind(sink, instance))
    return instance.tb ?? error("no talkback received from source")
  }

export default observe
