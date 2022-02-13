export function isNotUndefined<T>(this: unknown, value: T | undefined): value is T {
  return value !== undefined
}
