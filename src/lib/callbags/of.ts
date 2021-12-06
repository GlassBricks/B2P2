import { DATA, END, Sink, Source, START } from "./callbag"
import { bind, Functions } from "../references"

function source<T>(
  this: {
    values: T[]
  },
  type: START,
  sink: Sink<T>,
) {
  if (type !== 0) return
  let nextIndex = 1
  const i = { completed: false }
  sink(0, bind(tb, i))
  while (nextIndex <= this.values.length && !i.completed) {
    sink(1, this.values[nextIndex - 1])
    nextIndex++
  }
  if (!i.completed) {
    sink(2)
  }
}

function tb(
  this: {
    completed: boolean
  },
  type: DATA | END,
): void {
  if (type === 2) {
    this.completed = true
  }
}

Functions.register({ source, tb })

const of = <T>(...values: T[]): Source<T> => bind(source, { values, completed: false, nextIndex: 1 }) as Source<T>
export default of
