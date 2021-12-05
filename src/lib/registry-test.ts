import { FuncName, Functions } from "./references"

const testFuncName = " -- test -- func --" as FuncName
const func = () => 0
Functions.registerAs(testFuncName, func)
test("Can register function", () => {
  assert.same(func, Functions.get(testFuncName))
  assert.same(testFuncName, Functions.nameOf(func))
})

test("error on duplicate func", () => {
  assert.error(() => {
    Functions.registerAs("foo", () => 0)
    Functions.registerAs("foo", () => 0)
  })
})

test("error on nonexistent func", () => {
  assert.error(() => {
    Functions.get("foo" as FuncName)
  })
})

test("Error when registering after load", () => {
  assert.error(() => {
    Functions.registerAs("foo", func)
  })
})
