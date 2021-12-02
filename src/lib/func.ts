import { ClassRegisterer, OnLoad, RegisteredClass } from "./classes"
import { Registry } from "./registry"

export type AnyFunction = (this: any, ...args: any) => any
export type ThisParameter<F extends AnyFunction> = F extends (this: infer T, ...args: any) => any ? T : never

type AliasFunc<F extends (this: any, ...args: any) => any> = (
  this: ThisParameter<F>,
  ...args: Parameters<F>
) => ReturnType<F>

export interface Func<F extends AnyFunction> extends AliasFunc<F>, Function {}
export abstract class Func<F extends AnyFunction> extends RegisteredClass implements Function {
  protected abstract __call(thisArg: ThisParameter<F>, ...args: Parameters<F>): ReturnType<F>
}
Func.prototype = RegisteredClass.prototype as Func<AnyFunction>

const registerClass = ClassRegisterer("func:")

export type FuncName = string & { _funcNameBrand: any }
export const Functions = new Registry<AnyFunction, FuncName>("function", (func) => serpent.block(debug.getinfo(func)))

@registerClass()
class RegisteredFunc<F extends AnyFunction> extends Func<F> {
  private readonly funcName: FuncName
  private func?: AnyFunction

  constructor(func: F) {
    super()
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
    return this.func.call(thisArg, ...args)
  }
}

/** Requires function to be registered first. */
export function funcRef<F extends AnyFunction>(func: F): Func<F> {
  return new RegisteredFunc(func)
}

@registerClass()
class InstanceFunc<T extends Record<K, AnyFunction>, K extends keyof T> extends Func<OmitThisParameter<T[K]>> {
  constructor(private readonly instance: T, private readonly key: K) {
    super()
  }

  __call(thisArg: unknown, ...args: any[]) {
    return this.instance[this.key](...args)
  }
}

export function funcOn<T extends Record<K, AnyFunction>, K extends keyof T>(
  obj: T,
  key: K,
): Func<OmitThisParameter<T[K]>> {
  return new InstanceFunc(obj, key)
}

@registerClass()
class Bind1<A0> extends Func<AnyFunction> {
  constructor(private readonly func: Func<(arg0: A0, ...args: any) => any>, private readonly arg0: A0) {
    super()
  }
  __call(thisArg: any, ...args: any[]) {
    return this.func(thisArg, this.arg0, ...args)
  }
}

@registerClass()
class Bind2<A0, A1> extends Func<AnyFunction> {
  constructor(
    private readonly func: Func<(arg0: A0, arg1: A1, ...args: any) => any>,
    private readonly arg0: A0,
    private readonly arg1: A1,
  ) {
    super()
  }

  __call(thisArg: any, ...args: any[]) {
    return this.func.call(thisArg, this.arg0, this.arg1, ...args)
  }
}

@registerClass()
class BindAll<A extends any[]> extends Func<() => any> {
  constructor(private readonly func: Func<(...args: A) => any>, private readonly args: A) {
    super()
  }

  __call(thisArg: unknown) {
    return this.func.call(thisArg, ...this.args)
  }
}

export function bind1<T, A0, A extends any[], R>(
  func: Func<(this: T, arg0: A0, ...args: A) => R>,
  arg0: A0,
): Func<(this: T, ...args: A) => R> {
  return new Bind1(func, arg0)
}
export function bind2<T, A0, A1, A extends any[], R>(
  func: Func<(this: T, arg0: A0, arg1: A1, ...args: A) => R>,
  arg0: A0,
  arg1: A1,
): Func<(this: T, ...args: A) => R> {
  return new Bind2(func, arg0, arg1)
}
export function bindAll<T, A extends any[], R>(
  func: Func<(this: T, ...args: A) => R>,
  ...args: A
): Func<(this: T) => R> {
  return new BindAll(func, args)
}
