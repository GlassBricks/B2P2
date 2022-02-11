type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

declare interface LuaSet<T extends AnyNotNil> extends LuaPairsIterable<T, true> {
  size: LuaLengthMethod<number>
  add: LuaTableSetMethod<T, true>
  has: LuaTableHasMethod<T>
  delete: LuaTableDeleteMethod<T>
}

declare const LuaSet: (new <TKey extends AnyNotNil>() => LuaSet<TKey>) & LuaExtension<"__luaTableNewBrand">

declare function next<T>(table: LuaSet<any>, index?: T): LuaMultiReturn<[T, true] | []>

declare interface LuaMap<TKey extends AnyNotNil, TValue> extends LuaPairsIterable<TKey, TValue> {
  get: LuaTableGetMethod<TKey, TValue>
  set: LuaTableSetMethod<TKey, TValue>
  has: LuaTableHasMethod<TKey>
  delete: LuaTableDeleteMethod<TKey>
}

declare const LuaMap: (new <TKey extends AnyNotNil, TValue>() => LuaMap<TKey, TValue>) &
  LuaExtension<"__luaTableNewBrand">
