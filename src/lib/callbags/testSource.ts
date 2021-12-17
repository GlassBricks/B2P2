import { CallbagMsg, DATA, END, Sink, SinkSource } from "./callbag"

import { Classes, Func } from "../references"

export interface TestSource<T> extends SinkSource<T> {
  readonly ended: boolean
}

@Classes.registerDefault()
class TestSourceImpl<T> extends Func<any> implements TestSource<T> {
  private sink?: Sink<T>
  ended = false

  protected __call(type: CallbagMsg, data?: any): void {
    if (type === 0) {
      if (this.ended) {
        error("Test source already ended")
      }
      if (this.sink) {
        error("duplicate subscription to testSource")
      }
      this.sink = data ?? error("No sink provided")
      const func = (this as TestSourceImpl<T>).ref("tb")
      this.sink!(0, func)
    } else {
      this.sink?.(type as any, data)
      if (type === 2) {
        this.sink = undefined
        this.ended = true
      }
    }
  }

  tb(type: DATA | END) {
    if (type === 2) {
      this.sink = undefined
      this.ended = true
    }
  }
}

export function testSource<T>(): TestSource<T> {
  return new TestSourceImpl()
}
