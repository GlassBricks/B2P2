import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"

// --- Functions ---
export type AnyFunction = (this: any, ...args: any) => any

class Registry<T, N extends string = string> {
  private readonly nameToItem = {} as Record<N, T>
  private readonly itemToName = new LuaTable<T, N>()
  constructor(private readonly itemName: string, private readonly debugInfo: (item: T) => string) {}

  register(name: string, item: T): T {
    checkIsBeforeLoad()
    const existing: T = this.nameToItem[name as N]
    if (existing) {
      error(`${this.itemName} with the name ${name} is already registered, existing is: ${this.debugInfo(existing)}`)
    }
    this.nameToItem[name as N] = item
    this.itemToName.set(item, name as N)
    return item
  }

  get<V extends T>(name: N): V {
    return (this.nameToItem[name] as V) || error(`could not find ${this.itemName} with name ${name}`)
  }

  nameOf(item: T): N {
    return this.itemToName.get(item) ?? error(`The given ${this.itemName} was not registered: ${this.debugInfo(item)}`)
  }
}

export type FuncName = string & { _funcNameBrand: any }
export const Functions = new Registry<AnyFunction, FuncName>("function", (func) => serpent.block(debug.getinfo(func)))

// --- Metatables ---

declare const global: {
  __metatables: LuaTable<object, MetatableName>
  // __instances: Record<object, RegisteredClass>
  // __nextInstanceId: InstanceId
}

export type MetatableName = string & { _metatableNameBrand: any }
export const Metatables = new Registry<LuaMetatable<object>, MetatableName>("metatable", (tbl) => serpent.block(tbl))

export const OnLoad: unique symbol = Symbol("Metatable OnLoad")
export interface WithOnLoad {
  [OnLoad]?(): void
}

Events.onAll({
  on_init() {
    global.__metatables = setmetatable({}, { __mode: "k" })
    // global.__instances = setmetatable(
    //   {},
    //   {
    //     __mode: "v",
    //   },
    // )
    // global.__nextInstanceId = 1 as InstanceId
  },
  on_load() {
    setmetatable(global.__metatables, { __mode: "k" })
    for (const [table, tableOrName] of pairs(global.__metatables)) {
      const metatable = Metatables.get(tableOrName)
      if (!metatable) {
        error(
          `Could not find a class/metatable with the name ${tableOrName}. Check that the class/metatable was registered properly, and/or migrations are correct.`,
        )
      }
      setmetatable(table, metatable)
      const onLoadFunc = (table as WithOnLoad)[OnLoad]
      if (onLoadFunc !== undefined) onLoadFunc.call(table)
    }
  },
})

// --- Classes ---

export type ClassName = MetatableName & { _classNameBrand: any }
const RegisteredClassInfo: unique symbol = Symbol("RegisteredClassInfo")
export interface RegisteredClassInfo {
  name: ClassName
  prototypeFuncNames: LuaTable<AnyFunction, keyof any>
  funcRef?: boolean
}

export interface RegisteredType<T extends RegisteredClass = RegisteredClass> {
  [RegisteredClassInfo]: RegisteredClassInfo
  name: string
  prototype: T
}

export interface RegisteredClass {
  _registeredClassBrand: any
}

export abstract class RegisteredClass implements WithOnLoad {
  static [RegisteredClassInfo]: RegisteredClassInfo;
  [OnLoad]?(): void

  // __instanceId: InstanceId

  constructor() {
    const classInfo = (this.constructor as typeof RegisteredClass)[RegisteredClassInfo]
    if (!classInfo) {
      error(
        `Class "${this.constructor.name}" inherits from RegisteredClass, but was not registered with @registerClass().`,
      )
    }
    if (!game) {
      error("Registered classes can only be instantiated during events and not during on_load.")
    }
    global.__metatables.set(this, classInfo.name)
    // this.__instanceId = global.__nextInstanceId
    // global.__nextInstanceId++
    // global.__instances[this.__instanceId] = this
  }

  ref<T extends RegisteredClass, F extends (this: T, ...args: any) => any>(this: T, func: F): Func<F> {
    const name = (this.constructor as typeof RegisteredClass)[RegisteredClassInfo].prototypeFuncNames.get(func)
    if (name && (this as any)[name] === func) {
      return funcOn(this as any, name)
    }
    return funcRef(func, this as ThisParameterType<F>)
  }
}

export function ClassRegisterer(prefix?: string): <T extends RegisteredType>(as?: string) => (clazz: T) => void {
  if (!prefix) {
    prefix = string.match(debug.getinfo(2, "S")!.source!, "^.+/(.+)%.lua")[0] + "::"
  }
  return function registerClass<T extends RegisteredType>(as?: string) {
    return (clazz: T): void => {
      checkIsBeforeLoad()
      const name = prefix + (as ?? clazz.name)
      const thisPrototype = clazz.prototype as LuaMetatable<T>
      Metatables.register(name, thisPrototype)

      const prototypeFuncNames = new LuaTable<AnyFunction, string>()
      // record all prototype functions
      let callFunction: AnyFunction | undefined = undefined
      let prototype: LuaMetatable<table> | undefined = thisPrototype
      while (prototype) {
        for (const [key, value] of pairs(prototype)) {
          if (typeof value === "function") {
            prototypeFuncNames.set(value, key)
          }
        }
        callFunction ??= rawget(prototype, "__call")
        prototype = getmetatable(prototype)
      }
      if (callFunction) {
        thisPrototype.__call = callFunction
        ;(thisPrototype as any).call = callFunction
      }

      clazz[RegisteredClassInfo] = {
        name,
        prototypeFuncNames,
      } as RegisteredClassInfo

      // register all static functions
      for (const [key, value] of pairs(clazz as unknown)) {
        if (typeof value === "function") {
          Functions.register(`${name}.${key}` as FuncName, value)
        }
      }
    }
  }
}

// Func class

export type Func<F extends AnyFunction> = F & RegisteredClass

export interface FuncClass<F extends AnyFunction> extends RegisteredClass, LuaMetatable<FuncClass<F>> {
  __call(thisArg: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F>
  call?: this["__call"]
}
export function objAsFunc<F extends AnyFunction>(obj: FuncClass<F>): Func<F> {
  return obj as unknown as Func<F>
}

const registerClass = ClassRegisterer("<builtin>::")

@registerClass()
class RegisteredFunc<F extends AnyFunction> extends RegisteredClass implements FuncClass<F> {
  private readonly funcName: FuncName
  private func?: AnyFunction

  constructor(func: F, private readonly boundThis?: ThisParameterType<F>) {
    super()
    this.func = func
    this.funcName = Functions.nameOf(func)
  }
  [OnLoad]() {
    Functions.get(this.funcName)
  }

  __call(thisArg: unknown, ...args: any[]) {
    if (!this.func) {
      this.func = Functions.get(this.funcName)
    }

    return this.func.call(this.boundThis || thisArg, ...args)
  }
}

/** Requires function to be registered first. */
export function funcRef<F extends AnyFunction>(func: F, boundThis?: ThisParameterType<F>): Func<F> {
  return objAsFunc(new RegisteredFunc(func, boundThis))
}

@registerClass()
class InstanceFunc<F extends AnyFunction> extends RegisteredClass implements FuncClass<F> {
  constructor(
    private readonly instance: Record<keyof any, AnyFunction>,
    private readonly key: keyof any,
    private readonly boundThis?: ThisParameterType<F>,
  ) {
    super()
  }

  __call(thisArg: unknown, ...args: any[]) {
    const instance = this.instance
    return instance[this.key].call(this.boundThis || instance, ...args)
  }
}

export function funcOn<T extends Record<K, AnyFunction>, K extends keyof T>(
  obj: T,
  key: K,
  boundThis?: ThisParameterType<T[K]>,
): Func<T[K]> {
  return objAsFunc(new InstanceFunc(obj, key, boundThis))
}
