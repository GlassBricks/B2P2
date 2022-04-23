import { Classes } from "../references"
import { BroadcastingObservable } from "./BroadcastingObservable"

export interface ObservableArrayChange<T> {
  array: ObservableArray<T>
  add?: {
    index: number
    value: T
  }
  remove?: {
    index: number
    value: T
  }
  swap?: {
    indexA: number
    indexB: number
    valueA: T
    valueB: T
  }
  change?: {
    index: number
    oldValue: T
    value: T
  }
}
@Classes.register()
export class ObservableArray<T extends AnyNotNil> extends BroadcastingObservable<ObservableArrayChange<T>> {
  private array: T[] = []
  public get(): readonly T[] {
    return this.array
  }

  public length(): number {
    return this.array.length
  }

  public remove(index: number): T {
    const { array } = this
    const oldValue = array[index]
    table.remove(array, index + 1)
    super.next({ array: this, remove: { index, value: oldValue } })
    return oldValue
  }

  public insert(index: number, value: T): void {
    const { array } = this
    table.insert(array, index + 1, value)
    super.next({ array: this, add: { index, value } })
  }

  public push(value: T): void {
    this.insert(this.array.length, value)
  }

  public pop(): T {
    return this.remove(this.array.length - 1)
  }

  public set(index: number, value: T): void {
    const { array } = this
    const oldValue = array[index]
    if (oldValue !== value) {
      array[index] = value
      super.next({ array: this, change: { index, oldValue, value } })
    }
  }

  public swap(indexA: number, indexB: number): void {
    const { array } = this
    const oldValueA = array[indexA]
    const oldValueB = array[indexB]
    array[indexA] = oldValueB
    array[indexB] = oldValueA
    super.next({ array: this, swap: { indexA, indexB, valueA: oldValueA, valueB: oldValueB } })
  }

  public value(): readonly T[] {
    return this.array
  }
}
