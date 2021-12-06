import { DATA, END, Source, START, Talkback } from "./callbag"
import { bind, Functions } from "../references"

function sink<T>(
  this: {
    tb?: Talkback
    consumer: (this: void, item: T) => void
  },
  type: START | DATA | END,
  data?: any,
) {
  if (type === 0) {
    this.tb = data
    this.tb!(1)
  } else if (type === 1) {
    this.consumer(data)
    this.tb!(1)
  }
}

Functions.register({ sink })

const forEach =
  <T>(consumer: (item: T) => void) =>
  (source: Source<T>): void => {
    source(0, bind(sink, { consumer }))
  }

export default forEach
