/* eslint-disable @typescript-eslint/no-empty-function,no-invalid-this */
import {
  AnyFunction,
  funcRef,
  ClassRegisterer,
  FuncName,
  Func,
  Functions,
  MetatableName,
  Metatables,
  funcOn,
  RegisteredClass,
} from "./references"

const registerClass = ClassRegisterer()

describe("Function registry", () => {
  after_each(() => {
    Functions.unregister("foo")
  })

  test("Can register function", () => {
    const func = () => {}
    Functions.register("foo", func)
    assert.same(func, Functions.get("foo" as FuncName))
    assert.same("foo", Functions.nameOf(func))
  })

  test("error on duplicate func", () => {
    assert.error(() => {
      Functions.register("foo", () => {})
      Functions.register("foo", () => {})
    })
  })
  test("error on nonexistent func", () => {
    assert.error(() => {
      Functions.get("foo" as FuncName)
    })
  })
})

declare const global: {
  __ref: Func<AnyFunction>
  __refWithOverride: Func<AnyFunction>
  __tbl: object
}
describe("func ref", () => {
  function func(this: unknown, arg: any) {
    return {
      this: this === global ? undefined : this,
      arg,
    }
  }
  Functions.register("_test_-Func", func)

  test("Simple func ref", () => {
    global.__ref = funcRef(func)
    assert.same({ arg: "foo" }, global.__ref("foo"))
    assert.same({ this: 1, arg: "foo" }, global.__ref.call(1, "foo"))

    global.__refWithOverride = funcRef(func, 0)
    assert.same({ this: 0, arg: "foo" }, global.__refWithOverride("foo"))
    assert.same({ this: 0, arg: "foo" }, global.__refWithOverride.call(1, "foo"))
  }).after_mod_reload(() => {
    assert.same({ arg: "foo" }, global.__ref("foo"))
    assert.same({ this: 1, arg: "foo" }, global.__ref.call(1, "foo"))
    assert.same({ this: 0, arg: "foo" }, global.__refWithOverride("foo"))
    assert.same({ this: 0, arg: "foo" }, global.__refWithOverride.call(1, "foo"))
  })

  test("Func ref on instance", () => {
    const obj = {
      func() {
        return "func called"
      },
    }
    const ref = funcOn(obj, "func")
    assert.equal("func called", ref())
  })
})

describe("Metatable registry", () => {
  const metaTbl = { __mode: "k" as const }
  Metatables.register("foo", metaTbl)

  test("Can register metatable", () => {
    assert.same(metaTbl, Metatables.get("foo" as MetatableName))
    assert.same("foo", Metatables.nameOf(metaTbl))
  })
})

describe("Classes", () => {
  @registerClass("Foo")
  class TestClass extends RegisteredClass {
    constructor(private readonly value: string) {
      super()
    }
    foo() {
      return this.value + "2"
    }
  }

  test("Name registered correctly", () => {
    assert.equal("references-test::Foo", Metatables.nameOf(TestClass.prototype as LuaMetatable<TestClass>))
  })

  test("classes survives reload", () => {
    const instance = new TestClass("1")
    global.__tbl = instance
    global.__ref = instance.ref(instance.foo)

    assert.is_true(global.__tbl instanceof TestClass)
    assert.equal("12", global.__ref("12"))
  }).after_mod_reload(() => {
    assert.is_true(global.__tbl instanceof TestClass)
    assert.equal("12", global.__ref("12"))
  })
})
