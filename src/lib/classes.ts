import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"
import { AnyFunction, Functions, Registry } from "./registry"

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

  // ref<T extends RegisteredClass, F extends (this: T, ...args: any) => any>(this: T, func: F): Func<F> {
  //   const name = (this.constructor as typeof RegisteredClass)[RegisteredClassInfo].prototypeFuncNames.get(func)
  //   if (name && (this as any)[name] === func) {
  //     return funcOn(this as any, name)
  //   }
  //   return funcRef(func, this as ThisParameterType<F>)
  // }
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
  return string.match(debug.getinfo(upStack + 2, "S")!.source!, "^.+/(.+)%.lua")[0] + "::"
}

export function ClassRegisterer(prefix?: string): <T extends RegisteredType>(as?: string) => (clazz: T) => void {
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
      let callFunction: AnyFunction | undefined = undefined
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
        ;(thisPrototype as any).call = callFunction
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

export function registerDefaultClass(as?: string): (clazz: RegisteredType) => void {
  return ClassRegisterer(getPrefix(1))(as)
}
