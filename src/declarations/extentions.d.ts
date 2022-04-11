declare type LuaTableAddMethod<TKey extends AnyNotNil> = ((key: TKey) => void) &
  LuaExtension<"__luaTableAddMethodBrand">

declare type LuaTableFirstMethod<TKey extends AnyNotNil> = (() => TKey | undefined) &
  LuaExtension<"__luaTableFirstMethodBrand">

declare interface ReadonlyLuaSet<T extends AnyNotNil> extends LuaPairsIterable<T, true> {
  readonly size: LuaLengthMethod<number>
  readonly has: LuaTableHasMethod<T> & LuaTableHasMethod<AnyNotNil>
  readonly first: LuaTableFirstMethod<T>
}

declare interface LuaSet<T extends AnyNotNil> extends LuaPairsIterable<T, true> {
  readonly size: LuaLengthMethod<number>
  readonly first: LuaTableFirstMethod<T>
  readonly has: LuaTableHasMethod<T> & LuaTableHasMethod<AnyNotNil>
  readonly add: LuaTableAddMethod<T>
  readonly delete: LuaTableDeleteMethod<T>
}

declare const LuaSet: (new <TKey extends AnyNotNil>(...values: TKey[]) => LuaSet<TKey>) &
  LuaExtension<"__luaSetNewBrand">

declare function next<T>(table: LuaSet<any>, index?: T): LuaMultiReturn<[T, true] | []>

declare interface LuaMap<TKey extends AnyNotNil, TValue> extends LuaPairsIterable<TKey, TValue> {
  get: LuaTableGetMethod<TKey, TValue>
  set: LuaTableSetMethod<TKey, TValue>
  has: LuaTableHasMethod<TKey>
  delete: LuaTableDeleteMethod<TKey>
}

declare const LuaMap: (new <TKey extends AnyNotNil, TValue>() => LuaMap<TKey, TValue>) &
  LuaExtension<"__luaTableNewBrand">

declare type WithMetatable<T, M> = T & {
  [P in keyof M]: M[P] extends (self: any, ...args: infer A) => infer R ? (this: T, ...args: A) => R : M[P]
}

declare const luaLength: LuaLength<object, number>
