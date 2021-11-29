import { FuncName, Functions } from "./registry"

const testFuncName = " -- test -- func --" as FuncName
const func = () => 0
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
