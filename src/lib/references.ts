import Events from "./Events"
import { Registry } from "./registry"

// --- Classes ---
export const OnLoad: unique symbol = Symbol("OnLoad")

export interface WithOnLoad {
  [OnLoad]?(): void
}

// on a class it marks if the class was processed
// on an instance (prototype) it returns the class name
const RClassInfo: unique symbol = Symbol("ClassInfo")

export interface Class<T> {
  name: string
  prototype: T
}

export type ClassName = string & { _classNameBrand: any }

interface RClass {
  name: string
  prototype: ClassInstance & LuaMetatable<ClassInstance>
  ____super?: RClass
  [RClassInfo]?: {
    constructorProcessed?: true
    boundFuncKeys?: (keyof any)[]
  }
}

interface ClassInstance extends WithOnLoad {
  constructor: RClass
  ____constructor(...args: any): void
  [RClassInfo]: ClassName
}

declare const global: {
  __classes: LuaTable<ClassInstance, ClassName>
  // __instances: Record<object, ClassInstance>
  // __nextInstanceId: InstanceId
}

Events.onAll({
  on_init() {
    global.__classes = setmetatable({}, { __mode: "k" })
  },
  on_load() {
    setmetatable(global.__classes, { __mode: "k" })
    for (const [table, className] of pairs(global.__classes)) {
      const type = Classes.get(className)
      if (!type) {
        error(
          `Could not find a class with the name "${className}". Check that the class was registered properly, and/or migrations are correct.`,
        )
      }
      setmetatable(table, type.prototype as LuaMetatable<object>)
    }
    for (const [table] of pairs(global.__classes)) {
      table[OnLoad]?.()
    }
  },
})

export function bound(this: unknown, target: unknown, name: keyof any): void {
  const prototype = target as ClassInstance
  const constructor = prototype.constructor

  const classInfo = constructor[RClassInfo] ?? (constructor[RClassInfo] = {})
  const boundFuncKeys = classInfo.boundFuncKeys ?? (classInfo.boundFuncKeys = [])
  boundFuncKeys.push(name)
}

export const Classes = new (class Classes extends Registry<Class<any>, ClassName> {
  protected itemName = "class"

  protected getDebugDescription(item: RClass): string {
    return serpent.block(item)
  }

  protected getDefaultName(item: RClass): string {
    return item.name
  }

  declare register: (as?: string) => (this: unknown, item: Class<any>) => void
  protected onRegister(item: RClass, name: ClassName): void {
    const prototype = item.prototype
    prototype[RClassInfo] = name
    // make sure __call meta-method works for subclasses
    rawset(prototype, "__call", prototype.__call)

    let currentClass: RClass | undefined = item
    while (currentClass !== undefined) {
      // register all static functions

      for (const [key, value] of pairs(currentClass)) {
        // noinspection SuspiciousTypeOfGuard
        if (typeof value === "function" && typeof key === "string") {
          Functions.registerAs((name + "." + key) as FuncName, value)
        }
      }

      const baseClass: RClass | undefined = currentClass.____super
      const info = currentClass[RClassInfo] ?? (currentClass[RClassInfo] = {})
      if (!info.constructorProcessed) {
        const thisPrototype = currentClass.prototype
        if (info.boundFuncKeys) {
          const originalConstructor = thisPrototype.____constructor
          const funcKeys = info.boundFuncKeys
          thisPrototype.____constructor = function (this: Record<keyof any, ContextualFun>, ...args: any[]) {
            for (const funcKey of funcKeys) {
              this[funcKey] = boundPrototypeFunc(this, funcKey)
            }

            originalConstructor.call(this, ...args)
          }
        }
        if (baseClass === undefined) {
          const originalConstructor = thisPrototype.____constructor
          thisPrototype.____constructor = function (this: ClassInstance, ...args: any[]) {
            global.__classes.set(this, this[RClassInfo])
            originalConstructor.call(this, ...args)
          }
        }

        info.constructorProcessed = true
      }

      currentClass = baseClass
    }
  }
})()

// -- functions --

// eslint-disable-next-line @typescript-eslint/ban-types
export type AnyFunction = Function
export type ContextualFun = (this: any, ...args: any) => any
export type SelflessFun = (this: void, ...args: any) => any

export type Func<F extends AnyFunction> = F & {
  constructor: unknown
}

export interface FuncClass {
  callWithoutSelf(...args: unknown[]): any
}

export function callWithoutSelf<A extends any[], R>(func: (...args: A) => R, ...args: A): R {
  if (typeof func === "object") {
    const callWithoutSelf = (func as FuncClass).callWithoutSelf
    if (callWithoutSelf) {
      return callWithoutSelf.call(func, ...args)
    }
  }
  return func(...args)
}

export type FuncName = string & { _funcNameBrand: any }

export const Functions: Registry<AnyFunction, FuncName> = new (class Functions extends Registry<AnyFunction, FuncName> {
  protected itemName = "function"

  protected getDebugDescription(func: AnyFunction): string {
    return serpent.block(type(func) === "function" ? debug.getinfo(func) : func, { nocode: true })
  }

  protected getDefaultName(): string {
    error("name must be given to register functions")
  }

  protected onRegister(): void {
    // nothing
  }
})()

export function isCallable(obj: unknown): boolean {
  const objType = type(obj)
  if (objType === "function") {
    return true
  }
  if (objType === "table") {
    const metatable = getmetatable(obj)
    return metatable !== undefined && metatable.__call !== undefined
  }
  return false
}

@Classes.register()
class RegisteredFunc implements FuncClass {
  private readonly funcName: FuncName
  private func?: SelflessFun

  constructor(func: AnyFunction) {
    this.func = func as SelflessFun
    this.funcName = Functions.nameOf(func)
  }

  [OnLoad](): void {
    Functions.get(this.funcName)
  }

  __call(...args: any[]) {
    if (!this.func) {
      this.func = Functions.get(this.funcName)
    }
    return this.func(...args)
  }

  callWithoutSelf(...args: unknown[]): unknown {
    if (!this.func) {
      this.func = Functions.get(this.funcName)
    }
    return this.func(...args)
  }
}

/** Requires function to be registered first. */
export function funcRef<F extends AnyFunction>(func: F): Func<F> {
  return new RegisteredFunc(func) as any
}

@Classes.register()
class BoundFunc implements FuncClass {
  private readonly funcName: FuncName
  private func?: ContextualFun

  constructor(private readonly thisValue: unknown, func: ContextualFun) {
    this.func = func
    this.funcName = Functions.nameOf(func)
  }

  [OnLoad](): void {
    Functions.get(this.funcName)
  }

  __call(thisArg: unknown, ...args: any[]) {
    if (!this.func) {
      this.func = Functions.get(this.funcName)
    }
    return this.func.call(this.thisValue, ...args)
  }

  callWithoutSelf(...args: unknown[]): unknown {
    if (!this.func) {
      this.func = Functions.get(this.funcName)
    }
    return this.func.call(this.thisValue, ...args)
  }
}

/** Requires function to be registered first. */
export function bind<T, F extends (this: T, ...args: any) => any>(func: F, thisValue: T): Func<OmitThisParameter<F>> {
  return new BoundFunc(thisValue, func) as any
}

@Classes.register()
class InstanceFunc implements FuncClass {
  constructor(private readonly instance: Record<keyof any, ContextualFun>, private readonly key: keyof any) {}

  __call(thisArg: unknown, ...args: unknown[]) {
    return this.instance[this.key](...args)
  }

  callWithoutSelf(...args: unknown[]): unknown {
    return this.instance[this.key](...args)
  }
}

export function funcOn<T extends Record<K, ContextualFun>, K extends keyof T>(obj: T, key: K): Func<T[K]> {
  return new InstanceFunc(obj, key) as any
}

@Classes.register()
class BoundPrototypeFunc implements FuncClass {
  constructor(private readonly instance: Record<keyof any, ContextualFun>, private readonly key: keyof any) {}

  __call(thisArg: unknown, ...args: unknown[]) {
    const instance = this.instance
    const prototype = getmetatable(instance)!.__index as Record<keyof any, ContextualFun>
    return prototype[this.key].call(instance, ...args)
  }

  callWithoutSelf(...args: unknown[]): unknown {
    const instance = this.instance
    const prototype = getmetatable(instance)!.__index as Record<keyof any, ContextualFun>
    return prototype[this.key].call(instance, ...args)
  }
}

export function boundPrototypeFunc<T extends Record<K, ContextualFun>, K extends keyof T>(obj: T, key: K): Func<T[K]> {
  return new BoundPrototypeFunc(obj, key) as any
}

/*


@registerFuncClass
class Bind1<A0> extends Func<AnyFunction> {
  constructor(private readonly func: Func<(arg0: A0, ...args: any) => any>, private readonly arg0: A0) {
    super()
  }

  __call(...args: any[]) {
    return this.func(this.arg0, ...args)
  }
}

@registerFuncClass
class Bind2<A0, A1> extends Func<AnyFunction> {
  constructor(
    private readonly func: Func<(arg0: A0, arg1: A1, ...args: any) => any>,
    private readonly arg0: A0,
    private readonly arg1: A1,
  ) {
    super()
  }

  __call(...args: any[]) {
    return this.func(this.arg0, this.arg1, ...args)
  }
}

@registerFuncClass
class BindAll<A extends any[]> extends Func<() => any> {
  constructor(private readonly func: Func<(...args: A) => any>, private readonly args: A) {
    super()
  }

  __call() {
    return this.func(...this.args)
  }
}

export function bind1<A0, A extends any[], R>(
  func: Func<(arg0: A0, ...args: A) => R>,
  arg0: A0,
): Func<(...args: A) => R> {
  return new Bind1(func, arg0)
}
export function bind2<A0, A1, A extends any[], R>(
  func: Func<(arg0: A0, arg1: A1, ...args: A) => R>,
  arg0: A0,
  arg1: A1,
): Func<(...args: A) => R> {
  return new Bind2(func, arg0, arg1)
}
export function bindAll<A extends any[], R>(func: Func<(...args: A) => R>, ...args: A): Func<() => R> {
  return new BindAll(func, args)
}
*/
