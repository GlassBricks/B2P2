import { bound, Classes } from "../references"
import { CallbagMsg, DATA, END, Sink, SinkSource } from "./callbag"

export interface TestSource<T> extends SinkSource<T> {
  readonly ended: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TestSourceImpl<T> extends SinkSource<T> {}
@Classes.register()
class TestSourceImpl<T> implements TestSource<T> {
  private sink?: Sink<T>
  ended = false

  protected __call(thisArg: unknown, type: CallbagMsg, data?: any): void {
    if (type === 0) {
      if (this.ended) {
        error("Test source already ended")
      }
      if (this.sink) {
        error("duplicate subscription to testSource")
      }
      this.sink = data ?? error("No sink provided")
      const func = this.tb
      this.sink!(0, func)
    } else {
      this.sink?.(type as any, data)
      if (type === 2) {
        this.sink = undefined
        this.ended = true
      }
    }
  }

  @bound
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
