import { ClassRegisterer, OnLoad, RegisteredClass } from "./classes"
import { Func, FuncClass, FuncOrClass } from "./func"
import { AnyFunction } from "./registry"

const registerClass = ClassRegisterer("value:")

export interface ObservableValue<T> {
  get(): T
  addListener(listener: ChangeListener<T>, weakRef?: boolean): void
  removeListener(listener: ChangeListener<T>): void
}

export type ListenerFunc<T> = (observable: ObservableValue<T>) => void
export type ChangeListenerFunc<T> = Func<ListenerFunc<T>>
export type ChangeListener<T> = FuncOrClass<ListenerFunc<T>>

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ChangeListenerClass<T> extends FuncClass<ListenerFunc<T>> {}

type Truthy<T> = T extends false | undefined ? never : T
type Falsy<T> = T extends false | undefined ? T : never

export abstract class ObservableValue<T> extends RegisteredClass {
  and<B>(other: ValueOrObservable<B>): ObservableValue<Falsy<T> | B> {
    return Bindings.and(this, other)
  }

  or<B>(other: ValueOrObservable<B>): ObservableValue<Truthy<T> | B> {
    return Bindings.or(this, other)
  }

  not(): ObservableValue<boolean> {
    return Bindings.not(this)
  }

  orElse<B>(other: ValueOrObservable<B>): ObservableValue<NonNullable<T> | B> {
    return Bindings.orElse(this, other)
  }

  plus(this: ObservableValue<number>, other: ValueOrObservable<number>): ObservableValue<number> {
    return Bindings.plus(this, other)
  }

  minus(this: ObservableValue<number>, other: ValueOrObservable<number>): ObservableValue<number> {
    return Bindings.minus(this, other)
  }

  times(this: ObservableValue<number>, other: ValueOrObservable<number>): ObservableValue<number> {
    return Bindings.times(this, other)
  }

  div(this: ObservableValue<number>, other: ValueOrObservable<number>): ObservableValue<number> {
    return Bindings.div(this, other)
  }

  mod(this: ObservableValue<number>, other: ValueOrObservable<number>): ObservableValue<number> {
    return Bindings.mod(this, other)
  }

  concat(other: ValueOrObservable<unknown>): ObservableValue<string> {
    return Bindings.concat2(this, other)
  }

  index<K extends keyof T>(other: ValueOrObservable<K>): ObservableValue<T[K]> {
    return Bindings.index(this, other)
  }

  invoke<A extends any[], R>(
    this: ObservableValue<Func<(...args: A) => R>>,
    ...args: AsValueOrObservable<A>
  ): ObservableValue<R> {
    return Bindings.call(this, ...args)
  }

  map<A extends any[], R>(
    func: ValueOrObservable<Func<(arg0: T, ...args: A) => R>>,
    ...additionalArgs: AsValueOrObservable<A>
  ): ObservableValue<R> {
    return Bindings.call(func, this, ...additionalArgs)
  }

  asString(): ObservableValue<string> {
    return Bindings.asString(this)
  }
}

export type ValueOrObservable<T> = T | ObservableValue<T>

export type AsValueOrObservable<T> = {
  [K in keyof T]: T[K] | ObservableValue<T[K]>
}
export type AsObservable<T> = {
  [K in keyof T]: ObservableValue<T[K]>
}

export interface WritableValue<T> {
  get(): T
  set(value: T): void
}

interface Property<T> extends ObservableValue<T>, WritableValue<T> {
  bindBidirectional(other: Property<T>): void
  unbindBidirectional(other: Property<T>): void
}

@registerClass()
export class Listeners<T> extends RegisteredClass {
  private readonly listeners = new LuaTable<object, ChangeListenerFunc<T>>()

  private declare get: LuaTableGetMethod<object, object>
  private declare set: LuaTableSetMethod<object, object>
  private declare delete: LuaTableDeleteMethod<object>

  constructor() {
    super()
    this[OnLoad]()
  }
  [OnLoad](): void {
    setmetatable(this.listeners, { __mode: "kv" })
  }

  addListener(listener: ChangeListener<T>, weakRef?: boolean): void {
    const listeners = this.listeners
    if (listeners.has(listener)) {
      const key = {}
      listeners.set(key, listener as ChangeListenerFunc<T>)
      if (!weakRef) {
        this.set(key, listener)
      }
    } else {
      listeners.set(listener, listener as ChangeListenerFunc<T>)
      if (!weakRef) {
        this.set(listener, listener)
      }
    }
  }
  removeListener(listener: ChangeListener<T>): void {
    const listeners = this.listeners
    if (listeners.has(listener)) {
      listeners.delete(listener)
      this.delete(listener)
      return
    }
    for (const [key, value] of pairs(listeners)) {
      if (value === listener) {
        listeners.delete(key)
        this.delete(key)
        return
      }
    }
  }

  notify(observable: ObservableValue<T>): void {
    for (const [, listener] of pairs(this.listeners)) {
      listener(observable)
    }
  }
}

@registerClass()
export class SimpleProperty<T> extends ObservableValue<T> implements Property<T> {
  private value: T

  constructor(initialValue: T) {
    super()
    this.value = initialValue
  }
  private readonly listeners = new Listeners<T>()

  addListener(listener: ChangeListener<T> | ChangeListenerClass<T>, weakRef?: boolean): void {
    this.listeners.addListener(listener, weakRef)
  }
  removeListener(listener: ChangeListener<T>): void {
    this.listeners.removeListener(listener)
  }

  get(): T {
    return this.value
  }
  set(value: T): void {
    if (this.value !== value) {
      this.value = value
      this.listeners.notify(this)
    }
  }
  bindBidirectional(other: Property<T>): void {
    Bindings.bindBidirectional(this, other)
  }
  unbindBidirectional(other: Property<T>): void {
    Bindings.unbindBidirectional(this, other)
  }
}

@registerClass()
export class PropertyAdapter<T> extends ObservableValue<T> implements Property<T> {
  private constructor(private readonly obj: Record<keyof any, T>, private readonly key: keyof any) {
    super()
  }

  public static from<O extends Record<K, unknown>, K extends keyof O>(obj: O, key: K): PropertyAdapter<O[K]> {
    return new PropertyAdapter<O[K]>(obj as any, key)
  }

  private readonly listeners = new Listeners<T>()

  addListener(listener: ChangeListener<T>, weakRef?: boolean): void {
    this.listeners.addListener(listener, weakRef)
  }
  removeListener(listener: ChangeListener<T>): void {
    this.listeners.removeListener(listener)
  }

  get(): T {
    return this.obj[this.key]
  }
  set(value: T): void {
    const oldValue = this.obj[this.key]
    if (oldValue !== value) {
      this.obj[this.key] = value
      this.listeners.notify(this)
    }
  }
  valueChanged(): void {
    this.listeners.notify(this)
  }

  bindBidirectional(other: Property<T>): void {
    Bindings.bindBidirectional(this, other)
  }
  unbindBidirectional(other: Property<T>): void {
    Bindings.unbindBidirectional(this, other)
  }
}

@registerClass()
export class ConstantValue<T> extends ObservableValue<T> {
  constructor(private value: T) {
    super()
  }

  get(): T {
    return this.value
  }
  addListener(): void {
    // noop
  }
  removeListener(): void {
    // noop
  }

  asString(): ObservableValue<string> {
    return new ConstantValue(tostring(this.value))
  }
}

export function toObservable<T>(value: ValueOrObservable<T>): ObservableValue<T> {
  if (value instanceof ObservableValue) {
    return value
  }
  return new ConstantValue(value)
}

export function getValue<T>(value: ValueOrObservable<T>): T {
  if (value instanceof ObservableValue) {
    return value.get()
  }
  return value
}

export interface Binding<T> extends ObservableValue<T> {
  isValid(): boolean
  invalidate(): void
}

export abstract class Binding<T> extends ObservableValue<T> implements ChangeListenerClass<T> {
  private readonly listeners = new Listeners<T>()

  private valid = false
  private value!: T

  addListener(listener: ChangeListener<T>, weakRef?: boolean): void {
    this.listeners.addListener(listener, weakRef)
  }
  removeListener(listener: ChangeListener<T>): void {
    this.listeners.removeListener(listener)
  }

  isValid(): boolean {
    return this.valid
  }
  invalidate(): void {
    this.__call()
  }
  __call(): void {
    if (!this.valid) return
    this.valid = false
    this.listeners.notify(this)
  }
  declare call: this["__call"]

  protected addDependencies(dependencies: ObservableValue<unknown>[]): void {
    for (const dependency of dependencies) {
      dependency.addListener(this, true)
    }
  }
  protected abstract computeValue(): T

  get(): T {
    if (!this.valid) {
      this.value = this.computeValue()
      this.valid = true
    }
    return this.value
  }
}

export abstract class SimpleBinding<A extends unknown[], R> extends Binding<R> {
  private readonly dependencies: ObservableValue<unknown>[] & ObservableValue<unknown>
  private readonly numDeps: number

  constructor(values: AsValueOrObservable<A> & unknown[]) {
    super()
    this.dependencies = values.map(toObservable) as any
    this.addDependencies(this.dependencies)
    this.numDeps = this.dependencies.length
    if (this.numDeps <= 1) {
      this.dependencies = this.dependencies[0] as any
    }
  }

  protected computeValue(): R {
    const numDeps = this.numDeps
    if (numDeps === 1) {
      return this.compute(this.dependencies.get())
    } else if (numDeps === 2) {
      return this.compute(this.dependencies[0].get(), this.dependencies[1].get())
    } else if (numDeps === 3) {
      return this.compute(this.dependencies[0].get(), this.dependencies[1].get(), this.dependencies[2].get())
    }
    const values: unknown[] = []
    for (const i of $range(1, numDeps)) {
      values[i - 1] = this.dependencies[i - 1].get()
    }
    return this.compute(...values)
  }

  abstract compute(...args: any[]): R
}

const registerBinding = ClassRegisterer("SimpleBinding:")

export function BindingClass<A extends unknown[], R>(
  name: string,
  computeValue: (this: unknown, ...args: A) => R,
): (...args: AsValueOrObservable<A>) => ObservableValue<R> {
  const Class = class extends SimpleBinding<A, R> {
    declare compute
  }
  Class.prototype.compute = computeValue
  registerBinding(name)(Class)
  return (...args) => new Class(args)
}

@registerClass()
class BidirectionalBinding<T> extends RegisteredClass implements ChangeListenerClass<T> {
  private updating = false
  readonly property1: Property<T> | undefined
  readonly property2: Property<T> | undefined
  declare __mode: "v"
  constructor(property1: Property<T>, property2: Property<T>) {
    super()
    this.property1 = property1
    this.property2 = property2
  }

  __call(_: unknown, observable: ObservableValue<T>): void {
    if (this.updating) return
    const property1 = this.property1
    const property2 = this.property2
    if (!property1 || !property2) {
      property1?.removeListener(this)
      property2?.removeListener(this)
      return
    }

    this.updating = true

    if (observable === property1) {
      property2.set(property1.get())
    } else {
      property1.set(property2.get())
    }

    this.updating = false
  }

  __eq(other: unknown): boolean {
    if (!(other instanceof BidirectionalBinding)) return false
    return (
      (this.property1 === other.property1 && this.property2 === other.property2) ||
      (this.property1 === other.property2 && this.property1 === other.property2)
    )
  }
}
BidirectionalBinding.prototype.__mode = "v"

export namespace Bindings {
  export const and = BindingClass("&&", <A, B>(a: A, b: B) => a && b)
  export const or = BindingClass("||", <A, B>(a: A, b: B) => (a || b) as Truthy<A> | B)
  export const not = BindingClass("!", (a) => !a)
  export const orElse = BindingClass("??", <A, B>(a: A, b: B): NonNullable<A> | B => {
    if (a !== undefined) return a!
    return b
  })
  export const plus = BindingClass("+", (a: number, b: number) => a + b)
  export const minus = BindingClass("-", (a: number, b: number) => a - b)
  export const times = BindingClass("*", (a: number, b: number) => a * b)
  export const div = BindingClass("/", (a: number, b: number) => a / b)
  export const mod = BindingClass("%", (a: number, b: number) => a % b)
  export const concat2 = BindingClass("..", (a: unknown, b: unknown) => tostring(a) + b)

  const concatMany = BindingClass(".. many", (...values: unknown[]) =>
    table.concat(values.map((value) => tostring(value))),
  )
  export function concat(values: (unknown | ObservableValue<unknown>)[]): ObservableValue<string> {
    if (values.length === 0) {
      return new ConstantValue("")
    }
    if (values.length === 1) {
      return toObservable(values[0]).asString()
    }
    if (values.length === 2) {
      return concat2(values[0], values[1])
    }
    return concatMany(...values)
  }
  export const index = BindingClass("a[b]", <T, K extends keyof T>(obj: T, key: K) => obj[key])
  function callFuncRef<F extends AnyFunction>(func: Func<F>, ...args: Parameters<F>): ReturnType<F>
  function callFuncRef(func: Func<AnyFunction>, ...args: any[]) {
    return func(...args)
  }

  export const call = BindingClass(
    "a(...args)",
    <F extends AnyFunction>(...args: [func: Func<F>, ...args: Parameters<F>]): ReturnType<F> => callFuncRef(...args),
  )
  export const asString = BindingClass("tostring", (a) => tostring(a))

  export function bindBidirectional<T>(property1: Property<T>, property2: Property<T>): void {
    if (property1 === property2) error("Cannot bind property to itself")
    const binding = new BidirectionalBinding(property1, property2)
    property1.set(property2.get())
    property1.addListener(binding)
    property2.addListener(binding)
  }

  export function unbindBidirectional<T>(property1: Property<T>, property2: Property<T>): void {
    const binding = new BidirectionalBinding(property1, property2)
    property1.removeListener(binding)
    property2.removeListener(binding)
  }
}
