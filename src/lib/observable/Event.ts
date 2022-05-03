import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"

@Classes.register()
export class Event<T> extends BroadcastingObservable<T> {
  public raise(value: T): void {
    super.next(value)
  }
}
