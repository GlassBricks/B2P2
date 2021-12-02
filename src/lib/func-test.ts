import { AnyFunction, Func, funcOn, funcRef, Functions } from "./func"

declare const global: {
  __ref: Func<AnyFunction>
  __tbl: object
}
function func(this: unknown, arg: any) {
  return {
    // eslint-disable-next-line no-invalid-this
    this: this === global ? undefined : this,
    arg,
  }
}
Functions.register("_test_-Func", func)

test("Simple func ref", () => {
  global.__ref = funcRef(func)
  assert.same({ arg: "foo" }, global.__ref("foo"))
  assert.same({ this: 1, arg: "foo" }, global.__ref.call(1, "foo"))
}).after_mod_reload(() => {
  assert.same({ arg: "foo" }, global.__ref("foo"))
  assert.same({ this: 1, arg: "foo" }, global.__ref.call(1, "foo"))
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
