import { Mutable } from "./util-types"

export function shallowCopy<T extends object>(obj: T): T {
  const result: Partial<T> = {}
  for (const [k, v] of pairs(obj)) {
    result[k] = v
  }
  return result as T
}
export const mutableShallowCopy: <T extends object>(obj: T) => Mutable<T> = shallowCopy

export function mutate<T extends object>(obj: T, mutator: (obj: Mutable<T>) => void): T {
  const result = mutableShallowCopy(obj)
  mutator(result)
  return result
}

export function deepCompare<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object") return false
  // ignore null
  for (const [k, v] of pairs(a)) {
    if (!deepCompare(v, b[k])) return false
  }
  for (const [k] of pairs(b)) {
    if (a[k] === undefined) return false
  }
  return true
}

export function isEmpty(obj: object): boolean {
  return next(obj)[0] === undefined
}
