import { AnyFunction, Classes, Func, SelflessFun } from "../references"

@Classes.register()
class AsFunc<F extends AnyFunction> {
  private readonly func: SelflessFun
  constructor(func: F) {
    this.func = func as any
  }

  protected __call(thisArg: unknown, ...args: any[]) {
    return this.func(...args)
  }
}

export function asFunc<F extends (this: void, ...args: any) => any>(
  func: F,
): Func<(this: unknown, ...args: any) => any> {
  return new AsFunc(func) as any
}
