import { AnyFunction, Classes, Func, SelflessFun } from "./references"

export function getPlayer(): LuaPlayer {
  // noinspection LoopStatementThatDoesntLoopJS
  for (const [, player] of pairs(game.players)) {
    return player
  }
  error("Could not find any player")
}

export function asFunc<F extends AnyFunction>(func: F): Func<F> {
  return new AsFunc(func) as any
}

@Classes.register()
class AsFunc<F extends AnyFunction> {
  private readonly func: SelflessFun
  constructor(func: F) {
    this.func = func as any
  }

  protected __call(...args: any[]) {
    return this.func(...args)
  }
}
