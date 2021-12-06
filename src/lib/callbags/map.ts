import { bind, Func, Functions } from "../references"
import { Sink, Source, START } from "./callbag"

function mapSink<T, R>(
  this: {
    sink: Sink<R>
    func: Func<(value: T) => R>
  },
  type: number,
  data?: any,
) {
  // bug workaround
  this.sink(type as any, type === 1 ? (this.func(data) as unknown) : data)
}

function mapSource<T, R>(this: { source: Source<T>; func: Func<(value: T) => R> }, type: START, sink: Sink<R>) {
  if (type !== 0) return
  this.source(0, bind(mapSink, { sink, func: this.func }))
}

Functions.register({ mapSink, mapSource })

const map =
  <T, R>(func: Func<(value: T) => R>) =>
  (source: Source<T>): Source<R> =>
    bind(mapSource, { source, func }) as Source<R>

export default map
