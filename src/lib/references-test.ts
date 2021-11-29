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
  const testFuncName = " -- test -- func --" as FuncName
  const func = () => {}
  Functions.register(testFuncName, func)
  test("Can register function", () => {
    assert.same(func, Functions.get(testFuncName))
    assert.same(testFuncName, Functions.nameOf(func))
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

  test("Error when registering after load", () => {
    assert.error(() => {
      Functions.register("foo", func)
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

  test("Error when registering after load", () => {
    assert.error(() => {
      @registerClass("Nope")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestClass extends RegisteredClass {}
    })
  })

  test("Error when instantiating unregistered class", () => {
    class TestClass extends RegisteredClass {}
    assert.error(() => {
      // eslint-disable-next-line no-new
      new TestClass()
    })
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
