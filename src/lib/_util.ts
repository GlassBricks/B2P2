export function shallowCopy<T extends object>(obj: T): T {
  const result: Partial<T> = {}
  for (const [k, v] of pairs(obj)) {
    result[k] = v
  }
  return result as T
}
