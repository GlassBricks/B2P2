export type PRecord<K extends keyof any, V> = {
  [P in K]?: V
}
export type RRecord<K extends keyof any, V> = {
  readonly [P in K]: V
}
export type PRRecord<K extends keyof any, V> = {
  readonly [P in K]?: V
}

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

// expands object types recursively
export type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

export type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? A
  : B

export type WritableKeys<T> = keyof {
  [K in keyof T as IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K>]: K
}

export type ReadonlyKeys<T> = keyof {
  [K in keyof T as IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, never, K>]: K
}

export type NonFunctionKeys<T> = keyof {
  [K in keyof T as T[K] extends Function ? never : K]: K
}

export type RequiredKeys<T> = keyof {
  [K in keyof T as {} extends { [P in K]: T[K] } ? never : K]: K
}

export type ModableKeys<T> = Extract<keyof T, WritableKeys<T> & NonFunctionKeys<T>>
export type Index<T, K> = K extends keyof T ? T[K] : never
