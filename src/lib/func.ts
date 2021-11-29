import { AnyFunction, FuncName, Functions } from "./registry"
import { ClassRegisterer, OnLoad, RegisteredClass } from "./classes"

export type Func<F extends AnyFunction> = F & RegisteredClass

export interface FuncClass<F extends AnyFunction> extends RegisteredClass, LuaMetatable<FuncClass<F>> {
  __call(thisArg: ThisParameterType<F>, ...args: Parameters<F>): ReturnType<F>
  call?: this["__call"]
}
export type FuncOrClass<F extends AnyFunction> = Func<F> | FuncClass<F>

const registerClass = ClassRegisterer("func:")
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
  return new RegisteredFunc(func, boundThis) as unknown as Func<F>
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
  return new InstanceFunc(obj, key, boundThis) as unknown as Func<T[K]>
}
