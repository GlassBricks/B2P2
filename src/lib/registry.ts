import { checkIsBeforeLoad } from "./setup"

function getCallerFile(): string {
  return string.match(debug.getinfo(3, "S")!.source!, "^.-/(.+)%.lua")[0]
}

export abstract class Registry<T, N extends string> {
  private readonly nameToItem = {} as Record<N, T>
  private readonly itemToName = new LuaTable<T, N>()

  protected abstract getDefaultName(item: T): string

  protected abstract getDebugDescription(item: T): string

  protected abstract onRegister(item: T, name: N): void

  protected abstract itemName: string

  registerAs(name: N, item: T): void {
    checkIsBeforeLoad()
    const existing: T = this.nameToItem[name]
    if (existing) {
      error(
        `${this.itemName} with the name ${name} is already registered, existing is: ${this.getDebugDescription(
          existing,
        )}`,
      )
    }
    this.nameToItem[name] = item
    this.itemToName.set(item, name)
    this.onRegister(item, name)
  }

  register(as: string): (this: unknown, item: T) => void {
    const prefix = getCallerFile() + "::"
    return (item) => {
      const name = as ?? this.getDefaultName(item)
      this.registerAs((prefix + name) as N, item)
    }
  }

  registerAll(items: Record<string, T>): void {
    const prefix = getCallerFile() + "::"
    for (const [name, item] of pairs(items)) {
      this.registerAs((prefix + name) as N, item)
    }
  }

  get<V extends T>(name: N): V {
    return (this.nameToItem[name] as V) || error(`could not find ${this.itemName} with name ${name}`)
  }
  getOrNil<V extends T>(name: N): V | undefined {
    return this.nameToItem[name] as V | undefined
  }

  nameOf(item: T): N {
    return (
      this.itemToName.get(item) ??
      error(`The given ${this.itemName} was not registered: ${this.getDebugDescription(item)}`)
    )
  }
}
