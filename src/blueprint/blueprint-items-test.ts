import { allocateBPItemStack, freeBPItemStack } from "./blueprint-items"

test("can create blueprint item", () => {
  const stack = allocateBPItemStack()
  after_test(() => freeBPItemStack(stack))

  assert.equal("blueprint", stack.name)
})
