import { checkIsBeforeLoad } from "./setup"

function getCallerFile(): string {
  return string.match(debug.getinfo(3, "S")!.source!, "^.-/(.+)%.lua")[0]
}

export interface Registerer<T> {
  (this: unknown, as?: string): (this: unknown, item: T) => void
}

export abstract class Registry<T, N extends string> {
  private readonly nameToItem = {} as Record<N, T>
  private readonly itemToName = new LuaTable<T, N>()

  protected abstract getDefaultName(item: T): string

  protected abstract getDebugInfo(item: T): string

  protected abstract onRegister(item: T, name: N): void

  protected abstract itemName: string

  registerAs(name: string, item: T): void {
    const n = name as N
    checkIsBeforeLoad()
    const existing: T = this.nameToItem[n]
    if (existing) {
      error(`${this.itemName} with the name ${n} is already registered, existing is: ${this.getDebugInfo(existing)}`)
    }
    this.nameToItem[n] = item
    this.itemToName.set(item, n)
    this.onRegister(item, n)
  }

  registerDefault(item: T): void {
    this.registerAs((getCallerFile() + "::default") as N, item)
  }

  register(items: Record<string, T>): void {
    const prefix = getCallerFile() + "::"
    for (const [name, item] of pairs(items)) {
      this.registerAs((prefix + name) as N, item)
    }
  }

  registerer(prefix?: string): Registerer<T> {
    prefix = prefix ?? getCallerFile() + "::"
    return (as) => (item) => {
      this.registerAs((prefix + (as ?? this.getDefaultName(item))) as N, item)
    }
  }

  get<V extends T>(name: N): V {
    return (this.nameToItem[name] as V) || error(`could not find ${this.itemName} with name ${name}`)
  }

  nameOf(item: T): N {
    return (
      this.itemToName.get(item) ?? error(`The given ${this.itemName} was not registered: ${this.getDebugInfo(item)}`)
    )
  }
}
