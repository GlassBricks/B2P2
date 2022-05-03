import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"
import { Observable } from "./Observable"

export type ObservableListAdd<T> = {
  array: ObservableList<T>
  type: "add"
  index: number
  value: T
}
export type ObservableListRemove<T> = {
  array: ObservableList<T>
  type: "remove"
  index: number
  value: T
}
export type ObservableListSwap<T> = {
  array: ObservableList<T>
  type: "swap"
  indexA: number
  indexB: number
  newValueA: T
  newValueB: T
}
export type ObservableListSet<T> = {
  array: ObservableList<T>
  type: "set"
  index: number
  oldValue: T
  value: T
}
export type ObservableListChange<T> =
  | ObservableListAdd<T>
  | ObservableListRemove<T>
  | ObservableListSwap<T>
  | ObservableListSet<T>
export interface ObservableList<T extends AnyNotNil> extends Observable<ObservableListChange<T>> {
  length(): number
  value(): readonly T[]
  get(index: number): T
}

export interface MutableObservableList<T extends AnyNotNil> extends ObservableList<T> {
  set(index: number, value: T): void
  insert(index: number, value: T): void
  remove(index: number): void
  push(value: T): void
  pop(): T
  swap(indexA: number, indexB: number): void
}

@Classes.register()
class ObservableListImpl<T extends AnyNotNil>
  extends BroadcastingObservable<ObservableListChange<T>>
  implements MutableObservableList<T>
{
  private array: T[] = []

  public length(): number {
    return this.array.length
  }

  public value(): readonly T[] {
    return this.array
  }

  public get(index: number): T {
    return this.array[index]
  }

  public set(index: number, value: T): void {
    const { array } = this
    const oldValue = array[index]
    if (oldValue !== value) {
      array[index] = value
      super.next({
        array: this,
        type: "set",
        index,
        oldValue,
        value,
      })
    }
  }

  public insert(index: number, value: T): void {
    const { array } = this
    table.insert(array, index + 1, value)
    super.next({
      array: this,
      type: "add",
      index,
      value,
    })
  }

  public remove(index: number): T {
    const { array } = this
    const oldValue = array[index]
    table.remove(array, index + 1)
    super.next({
      array: this,
      type: "remove",
      index,
      value: oldValue,
    })
    return oldValue
  }

  public push(value: T): void {
    this.insert(this.array.length, value)
  }

  public pop(): T {
    return this.remove(this.array.length - 1)
  }

  public swap(indexA: number, indexB: number): void {
    const { array } = this
    const oldValueA = array[indexA]
    const oldValueB = array[indexB]
    array[indexA] = oldValueB
    array[indexB] = oldValueA
    super.next({
      array: this,
      type: "swap",
      indexA,
      indexB,
      newValueA: oldValueB,
      newValueB: oldValueA,
    })
  }
}

export function observableList<T extends AnyNotNil>(): MutableObservableList<T> {
  return new ObservableListImpl<T>()
}
