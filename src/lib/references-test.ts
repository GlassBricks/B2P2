import { bind, bound, Classes, ContextualFun, Func, funcOn, funcRef, Functions } from "./references"

declare const global: {
  __tbl: object
  __ref: Func<ContextualFun>
  __boundRef: Func<ContextualFun>
}
describe("classes", () => {
  @Classes.register("Foo")
  class TestClass {
    constructor(private readonly value: string) {}

    @bound
    foo() {
      return this.value + "2"
    }
  }

  test("Name registered correctly", () => {
    for (const [key, value] of pairs(TestClass.prototype)) {
      if (type(key) === "table") {
        // Class name symbol
        assert.equal("lib/references-test::Foo", value)
        return
      }
    }
    error("Class name symbol not")
  })

  test("Error when registering after load", () => {
    assert.error(() => {
      @Classes.register()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      class TestClass {}
    })
  })

  test("classes survives reload", () => {
    const instance = new TestClass("1")
    global.__tbl = instance
    global.__ref = instance.foo

    assert.is_true(global.__tbl instanceof TestClass)
    assert.equal("12", global.__ref("12"))
  }).after_mod_reload(() => {
    assert.is_true(global.__tbl instanceof TestClass)
    assert.equal("12", global.__ref("12"))
  })
})

describe("functions", () => {
  function func(arg: any) {
    return arg
  }
  Functions.register("test func 1")(func)

  function func2(this: unknown, arg: unknown) {
    return [this, arg]
  }
  Functions.register("test func 2")(func2)

  test("Simple func ref", () => {
    global.__ref = funcRef(func)
    global.__boundRef = bind(func2, 2)
    assert.same("foo", global.__ref("foo"))
    assert.same([2, "foo"], global.__boundRef("foo"))
  }).after_mod_reload(() => {
    assert.same("foo", global.__ref("foo"))
    assert.same([2, "foo"], global.__boundRef("foo"))
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
