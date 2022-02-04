import { bind, Func, Functions } from "../references"
import { DATA, END, Sink, Source, START, Talkback } from "./callbag"

function filterSink<T>(
  this: {
    sink: Sink<T>
    predicate: Func<(value: T) => boolean>
    tb?: Talkback
  },
  type: START | DATA | END,
  data?: any,
) {
  if (type === 0) {
    this.tb = data
    this.sink(type, data)
  } else if (type === 1) {
    if (this.predicate(data)) {
      this.sink(type, data)
    } else {
      this.tb!(1)
    }
  } else {
    this.sink(type, data)
  }
}

function filterSource<T>(
  this: { source: Source<T>; predicate: Func<(value: T) => boolean> },
  type: START,
  sink: Sink<T>,
) {
  if (type !== 0) return
  this.source(0, bind(filterSink, { sink, predicate: this.predicate }))
}

Functions.registerAll({ filterSink, filterSource })

const filter =
  <T>(predicate: Func<(value: T) => boolean>) =>
  (source: Source<T>): Source<T> =>
    bind(filterSource, { source, predicate }) as Source<T>

export default filter
