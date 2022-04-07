import { deepCompare, isEmpty, mutate, shallowCopy } from "./util"

test("shallowCopy", () => {
  const obj = {
    a: 1,
    b: {
      c: 2,
      d: 3,
    },
  }
  const copy = shallowCopy(obj)
  assert.equal(copy.a, 1)
  assert.equal(copy.b, obj.b)
})

test("mutate", () => {
  const obj = {
    a: 1,
    b: {
      c: 2,
      d: 3,
    },
  }
  const newObj = mutate(obj, (o) => {
    o.a = 2
    o.b.c = 3
  })
  assert.equal(newObj.a, 2)
  assert.equal(newObj.b.c, 3)
})

test("compare", () => {
  const a = {
    a: 1,
    b: {
      c: 2,
      d: 3,
    },
  }
  const b = {
    a: 1,
    b: {
      c: 2,
      d: 3,
    },
  }
  assert.is_true(deepCompare(a, b))
  const c = {
    a: 1,
    b: {
      c: 2,
      d: 4,
    },
  }
  assert.is_false(deepCompare(a, c))
})

test("isEmpty", () => {
  assert.is_true(isEmpty({}))
  assert.is_false(isEmpty({ a: 1 }))
})
