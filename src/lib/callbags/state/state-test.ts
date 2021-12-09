import { State, state } from "./state"
import { observe } from "../index"
import { shallowCopy } from "../../_util"
import pipe from "../pipe"
import * as util from "util"
import subscribe from "../subscribe"

let results: unknown[] = []
before_each(() => {
  results = []
})

describe("root state", () => {
  let s: State<number>
  before_each(() => {
    s = state(42)
  })

  test("Initializes with given value", () => {
    assert.equal(42, s.get())
  })

  test("Emits initial value", () => {
    observe((v) => {
      results.push(v)
    })(s)
    assert.same([42], results)
  })

  test("Tracks changes", () => {
    s.set(42)
    assert.equal(s.get(), 42)
    s.set(43)
    assert.equal(s.get(), 43)
  })

  test("Emits changes", () => {
    observe((v) => {
      results.push(v)
    })(s)
    s.set(43)
    s.set(44)
    assert.same([42, 43, 44], results)
  })

  test("closes subscriptions", () => {
    async(1)
    pipe(
      s,
      subscribe({
        complete: done,
      }),
    )
    s.clear()
  })
})

interface TestState {
  x: number
}

describe("sub state", () => {
  let parent: State<TestState>
  let child: State<TestState["x"]>
  before_each(() => {
    parent = state({ x: 42 })
    child = parent.sub("x")
  })

  test("Initializes with correct value", () => {
    assert.same(42, child.get())
  })

  test("Emits initial value", () => {
    observe((v) => {
      results.push(v)
    })(child)
    assert.same([42], results)
  })

  test("Tracks changes", () => {
    child.set(42)
    assert.equal(42, child.get())
    child.set(43)
    assert.equal(43, child.get())
  })

  test("Tracks changes from parent", () => {
    parent.set({ x: 42 })
    assert.equal(42, child.get())
    parent.set({ x: 43 })
    assert.equal(43, child.get())
  })

  test("Parent tracks changes", () => {
    child.set(42)
    assert.same({ x: 42 }, parent.get())
    child.set(43)
    assert.same({ x: 43 }, parent.get())
  })

  test("Emits changes", () => {
    observe((v) => {
      results.push(v)
    })(child)
    child.set(43)
    child.set(44)
    assert.same([42, 43, 44], results)
  })

  test("Emits changes from parent", () => {
    observe((v) => {
      results.push(v)
    })(child)
    parent.set({ x: 43 })
    parent.set({ x: 44 })
    assert.same([42, 43, 44], results)
  })

  test("Parent emits changes", () => {
    pipe(
      parent,
      observe((v) => {
        results.push(shallowCopy(v))
      }),
    )
    child.set(43)
    child.set(44)
    assert.same([{ x: 42 }, { x: 43 }, { x: 44 }], results)
  })

  test("does not emit if no change", () => {
    observe((v) => {
      results.push(v)
    })(child)
    parent.set({ x: 42 })
    assert.same([42], results)
  })

  test("Closes subscriptions without ending parent", () => {
    let parentClosed = false
    let childClosed = false
    pipe(
      parent,
      subscribe({
        complete() {
          parentClosed = true
        },
      }),
    )

    pipe(
      child,
      subscribe({
        complete() {
          childClosed = true
        },
      }),
    )
    assert.is_false(parentClosed)
    assert.is_false(childClosed)
    child.clear()
    assert.is_false(parentClosed)
    assert.is_true(childClosed)
  })

  test("Closes subscriptions without ending other subs", () => {
    let aClosed = false
    let bClosed = false
    const b = parent.sub("x")
    pipe(
      child,
      subscribe({
        complete() {
          aClosed = true
        },
      }),
    )
    pipe(
      b,
      subscribe({
        complete() {
          bClosed = true
        },
      }),
    )
    assert.is_false(aClosed)
    assert.is_false(bClosed)
    child.clear()
    assert.is_true(aClosed)
    assert.is_false(bClosed)
  })

  test("end parent closes sub ", () => {
    async(1)
    pipe(child, subscribe({ complete: done }))
    parent.clear()
  })
})

interface TestState2 {
  x: number
  y: number
}

describe("multiple sub state", () => {
  let parent: State<TestState2>
  before_each(() => {
    parent = state({ x: 42, y: 42 })
  })

  test("Only emits from parent when selected sub changed", () => {
    const x = parent.sub("x")
    const y = parent.sub("y")
    pipe(
      x,
      observe((v) => results.push({ x: v })),
    )
    pipe(
      y,
      observe((v) => results.push({ y: v })),
    )
    results = []
    parent.set({ x: 43, y: 42 })
    assert.same([{ x: 43 }], results)
    results = []
    parent.set({ x: 43, y: 43 })
    assert.same([{ y: 43 }], results)
    results = []
    parent.set({ x: 42, y: 42 })
    assert.same([{ x: 42 }, { y: 42 }], results)
  })

  test("Only emits from self when selected sub changed", () => {
    const x = parent.sub("x")
    const y = parent.sub("y")
    pipe(
      x,
      observe((v) => results.push({ x: v })),
    )
    pipe(
      y,
      observe((v) => results.push({ y: v })),
    )
    results = []
    x.set(43)
    assert.same([{ x: 43 }], results)
    results = []
    y.set(43)
    assert.same([{ y: 43 }], results)
    results = []
    x.set(42)
    y.set(42)
    assert.same([{ x: 42 }, { y: 42 }], results)
  })
})

interface TestState3 {
  x: TestState
}

describe("Deep sub state", () => {
  let parent: State<TestState3>
  let x: State<TestState3["x"]>
  let s: State<TestState3["x"]["x"]>
  before_each(() => {
    parent = state({ x: { x: 42 } })
    x = parent.sub("x")
    s = x.sub("x")
  })

  test("Tracks changes", () => {
    s.set(42)
    assert.equal(s.get(), 42)
    s.set(43)
    assert.equal(s.get(), 43)
  })

  test("Tracks changes from parents", () => {
    parent.set({ x: { x: 43 } })
    assert.same(43, s.get())
    x.set({ x: 44 })
    assert.equal(s.get(), 44)
  })

  test("Parents track changes", () => {
    s.set(42)
    assert.same({ x: { x: 42 } }, parent.get())
    assert.same({ x: 42 }, x.get())
    s.set(43)
    assert.same({ x: { x: 43 } }, parent.get())
    assert.same({ x: 43 }, x.get())
  })

  test("Emits changes", () => {
    observe((v) => {
      results.push(v)
    })(s)
    s.set(43)
    s.set(44)
    assert.same([42, 43, 44], results)
  })

  test("Emits changes from parent", () => {
    observe((v) => {
      results.push(v)
    })(s)
    parent.set({ x: { x: 43 } })
    x.set({ x: 44 })
    assert.same([42, 43, 44], results)
  })

  test("Parent emits changes", () => {
    const results2: unknown[] = []
    pipe(
      parent,
      observe((v) => {
        results.push(util.copy(v))
      }),
    )
    pipe(
      x,
      observe((v) => {
        results2.push(util.copy(v))
      }),
    )
    s.set(43)
    assert.same([{ x: { x: 42 } }, { x: { x: 43 } }], results)
    assert.same([{ x: 42 }, { x: 43 }], results2)
  })

  test("does not emit if no change", () => {
    observe((v) => {
      results.push(v)
    })(s)

    observe((v) => {
      results.push(v)
    })(x)

    parent.set({ x: { x: 42 } })

    results = []
    assert.same([], results)
  })

  test("end parent closes sub ", () => {
    async(1)
    pipe(s, subscribe({ complete: done }))
    parent.clear()
  })
})
