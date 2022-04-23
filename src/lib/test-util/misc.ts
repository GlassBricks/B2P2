import { AnyFunction, Classes, Func, SelflessFun } from "../references"

export function getPlayer(): LuaPlayer {
  // noinspection LoopStatementThatDoesntLoopJS
  for (const [, player] of pairs(game.players)) {
    return player
  }
  error("Could not find any player")
}

export function asFunc<F extends (this: void, ...args: any) => any>(
  func: F,
): Func<(this: unknown, ...args: any) => any> {
  return new AsFunc(func) as any
}

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
