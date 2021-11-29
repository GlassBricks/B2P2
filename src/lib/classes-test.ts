import { ClassRegisterer, RClassInfo, RegisteredClass } from "./classes"

declare const global: {
  __tbl: object
}

const registerClass = ClassRegisterer()

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
  assert.equal("references-test::Foo", TestClass[RClassInfo].name)
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
  // global.__ref = instance.ref(instance.foo)

  assert.is_true(global.__tbl instanceof TestClass)
  // assert.equal("12", global.__ref("12"))
}).after_mod_reload(() => {
  assert.is_true(global.__tbl instanceof TestClass)
  // assert.equal("12", global.__ref("12"))
})
