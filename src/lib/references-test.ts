import { AnyFunction, bind, Classes, Func, funcOn, funcRef, Functions, RClassInfo, RegisteredClass } from "./references"

declare const global: {
  __tbl: object
  __ref: Func<AnyFunction>
  __boundRef: Func<AnyFunction>
}
describe("classes", () => {
  const registerClass = Classes.registerer()

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
    assert.equal("lib/references-test::Foo", TestClass[RClassInfo].name)
  })

  test("Error when registering after load", () => {
    assert.error(() => {
      @registerClass()
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
    global.__ref = instance.ref("foo")

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
  Functions.registerAs("@@ test func 1 @@", func)

  function func2(this: unknown, arg: unknown) {
    return [this, arg]
  }
  Functions.registerAs("@@ test func 2 @@", func2)

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
