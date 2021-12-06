import { AnyFunction, Classes, Func } from "./references"

export function getPlayer(): LuaPlayer {
  // noinspection LoopStatementThatDoesntLoopJS
  for (const [, player] of pairs(game.players)) {
    return player
  }
  error("Could not find any player")
}

export function asFunc<F extends AnyFunction>(func: F): Func<F> {
  return new AsFunc(func)
}

const register = Classes.registerer()

@register()
class AsFunc<F extends AnyFunction> extends Func<F> {
  constructor(private readonly func: F) {
    super()
  }

  protected __call(...args: any[]): ReturnType<F> {
    return this.func(...args)
  }
}
