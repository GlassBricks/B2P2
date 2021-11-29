import { checkIsBeforeLoad } from "./setup"

export class Registry<T, N extends string = string> {
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

// --- Functions ---
export type AnyFunction = (this: any, ...args: any) => any

export type FuncName = string & { _funcNameBrand: any }
export const Functions = new Registry<AnyFunction, FuncName>("function", (func) => serpent.block(debug.getinfo(func)))
