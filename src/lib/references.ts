import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"
import { Registry } from "./registry"

// --- Classes ---

export type RClassName = string & { _classNameBrand: any }
const Classes = new Registry<RegisteredType, RClassName>("class", (tbl) => serpent.block(tbl))

export const OnLoad: unique symbol = Symbol("Metatable OnLoad")

export interface WithOnLoad {
  [OnLoad]?(): void
}

export const RClassInfo: unique symbol = Symbol("RegisteredClassInfo")

export interface RegisteredClassInfo {
  name: RClassName
  // prototypeFuncNames: LuaTable<AnyFunction, keyof any>
}

export interface RegisteredType<T extends RegisteredClass = RegisteredClass> {
  [RClassInfo]: RegisteredClassInfo
  name: string
  prototype: T
}

declare const global: {
  __classes: LuaTable<RegisteredClass, RClassName>
  // __instances: Record<object, RegisteredClass>
  // __nextInstanceId: InstanceId
}

export abstract class RegisteredClass implements WithOnLoad {
  static [RClassInfo]: RegisteredClassInfo;

  [OnLoad]?(): void

  // __instanceId: InstanceId

  constructor() {
    const classInfo = (this.constructor as typeof RegisteredClass)[RClassInfo]
    if (!classInfo) {
      error(
        `Class "${this.constructor.name}" inherits from RegisteredClass, but was not registered with @registerClass().`,
      )
    }
    if (!game) {
      error("Registered classes can only be instantiated during events and not during on_load.")
    }
    global.__classes.set(this, classInfo.name)
    // this.__instanceId = global.__nextInstanceId
    // global.__nextInstanceId++
    // global.__instances[this.__instanceId] = this
  }

  ref<T extends Record<K, ContextualFun>, K extends keyof T>(this: T, key: K): Func<T[K]> {
    return funcOn(this, key)
  }
}

Events.onAll({
  on_init() {
    global.__classes = setmetatable({}, { __mode: "k" })
    // global.__instances = setmetatable( {}, { __mode: "v" })
    // global.__nextInstanceId = 1 as InstanceId
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

function getPrefix(upStack: number) {
  return string.match(debug.getinfo(upStack + 2, "S")!.source!, "^.-/(.+)%.lua")[0] + "::"
}

export function ClassRegisterer(
  prefix?: string,
): <T extends RegisteredType>(as?: string) => (this: unknown, clazz: T) => void {
  if (!prefix) {
    prefix = getPrefix(1)
  }
  return function registerClass<T extends RegisteredType>(as?: string) {
    return (type: T): void => {
      checkIsBeforeLoad()
      const name = (prefix + (as ?? type.name)) as RClassName
      Classes.register(name, type)

      // const prototypeFuncNames = new LuaTable<AnyFunction, keyof any>()
      const thisPrototype = type.prototype as LuaMetatable<T>
      // record all prototype functions
      let callFunction: ContextualFun | undefined = undefined
      let prototype: LuaMetatable<table> | undefined = thisPrototype
      while (prototype) {
        // for (const [key, value] of pairs(prototype)) {
        //   if (typeof value === "function") {
        //     prototypeFuncNames.set(value, key)
        //   }
        // }
        callFunction ??= rawget(prototype, "__call")
        prototype = getmetatable(prototype)
      }
      if (callFunction) {
        thisPrototype.__call = callFunction
      }

      type[RClassInfo] = { name /*, prototypeFuncNames */ }

      // register all static functions
      for (const [key, value] of pairs(type as any)) {
        if (typeof key === "string" && typeof value === "function") {
          Functions.register(`${name}.${key}`, value)
        }
      }
    }
  }
}

export function registerDefaultClass(as?: string): (this: unknown, clazz: RegisteredType) => void {
  return ClassRegisterer(getPrefix(1))(as)
}

export type AnyFunction = (this: void, ...args: any) => any
export type ContextualFun = (this: any, ...args: any) => any

export interface Func<F extends AnyFunction> {
  (this: void, ...args: Parameters<F>): ReturnType<F>
  call: never
}

export abstract class Func<F> extends RegisteredClass {
  protected abstract __call(...args: Parameters<F>): ReturnType<F>
}

Func.prototype = RegisteredClass.prototype as Func<AnyFunction>

const registerFuncClass = ClassRegisterer("func:")

export type FuncName = string & { _funcNameBrand: any }
export const Functions = new Registry<AnyFunction, FuncName>("function", (func) => serpent.block(debug.getinfo(func)))

@registerFuncClass()
class RegisteredFunc extends Func<AnyFunction> {
  private readonly funcName: FuncName
  private func?: AnyFunction

  constructor(func: AnyFunction) {
    super()
    this.func = func
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
}

/** Requires function to be registered first. */
export function funcRef<F extends AnyFunction>(func: F): Func<F> {
  return new RegisteredFunc(func)
}

@registerFuncClass()
class InstanceFunc<T extends Record<K, ContextualFun>, K extends keyof T> extends Func<T[K]> {
  constructor(private readonly instance: T, private readonly key: K) {
    super()
  }

  __call(...args: any[]) {
    return this.instance[this.key](...args)
  }
}

export function funcOn<T extends Record<K, ContextualFun>, K extends keyof T>(obj: T, key: K): Func<T[K]> {
  return new InstanceFunc(obj, key)
}

@registerFuncClass()
class Bind1<A0> extends Func<AnyFunction> {
  constructor(private readonly func: Func<(arg0: A0, ...args: any) => any>, private readonly arg0: A0) {
    super()
  }

  __call(...args: any[]) {
    return this.func(this.arg0, ...args)
  }
}

@registerFuncClass()
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

@registerFuncClass()
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
