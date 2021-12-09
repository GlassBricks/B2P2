import { State, state } from "./state"
import { observe } from "../index"
import { shallowCopy } from "../../_util"
import pipe from "../pipe"
import * as util from "util"

let results: unknown[] = []
before_each(() => {
  results = []
})

describe("root state", () => {
  test("Initializes with given value", () => {
    const s = state(42)
    assert.equal(42, s.get())
  })

  test("Emits initial value", () => {
    const s = state(42)
    observe((v) => {
      results.push(v)
    })(s)
    assert.same([42], results)
  })

  test("Tracks changes", () => {
    const s = state(41)
    s.set(42)
    assert.equal(s.get(), 42)
    s.set(43)
    assert.equal(s.get(), 43)
  })

  test("Emits changes", () => {
    const s = state(42)
    observe((v) => {
      results.push(v)
    })(s)
    s.set(43)
    s.set(44)
    s.set(46)
    assert.same([42, 43, 44, 46], results)
  })
})

interface TestState {
  x: number
}

describe("sub state", () => {
  let parent: State<TestState>
  before_each(() => {
    parent = state({ x: 42 })
  })

  test("Initializes with correct value", () => {
    const s = parent.sub("x")
    assert.same(42, s.get())
  })

  test("Emits initial value", () => {
    const s = parent.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    assert.same([42], results)
  })

  test("Tracks changes", () => {
    const s = parent.sub("x")
    s.set(42)
    assert.equal(42, s.get())
    s.set(43)
    assert.equal(43, s.get())
  })

  test("Tracks changes from parent", () => {
    const s = parent.sub("x")
    parent.set({ x: 42 })
    assert.equal(42, s.get())
    parent.set({ x: 43 })
    assert.equal(43, s.get())
  })

  test("Parent tracks changes", () => {
    const s = parent.sub("x")
    s.set(42)
    assert.same({ x: 42 }, parent.get())
    s.set(43)
    assert.same({ x: 43 }, parent.get())
  })

  test("Emits changes", () => {
    const s = parent.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    s.set(43)
    s.set(44)
    s.set(46)
    assert.same([42, 43, 44, 46], results)
  })

  test("Emits changes from parent", () => {
    const s = parent.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    parent.set({ x: 43 })
    parent.set({ x: 44 })
    parent.set({ x: 46 })
    assert.same([42, 43, 44, 46], results)
  })

  test("Parent emits changes", () => {
    const s = parent.sub("x")
    pipe(
      parent,
      observe((v) => {
        results.push(shallowCopy(v))
      }),
    )
    s.set(43)
    s.set(44)
    assert.same([{ x: 42 }, { x: 43 }, { x: 44 }], results)
  })

  test("does not emit if no change", () => {
    const s = parent.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    parent.set({ x: 42 })
    assert.same([42], results)
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
  before_each(() => {
    parent = state({ x: { x: 42 } })
  })

  test("Tracks changes", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
    s.set(42)
    assert.equal(s.get(), 42)
    s.set(43)
    assert.equal(s.get(), 43)
  })

  test("Tracks changes from parents", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
    parent.set({ x: { x: 43 } })
    assert.same(43, s.get())
    x.set({ x: 44 })
    assert.equal(s.get(), 44)
  })

  test("Parents track changes", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
    s.set(42)
    assert.same({ x: { x: 42 } }, parent.get())
    assert.same({ x: 42 }, x.get())
    s.set(43)
    assert.same({ x: { x: 43 } }, parent.get())
    assert.same({ x: 43 }, x.get())
  })

  test("Emits changes", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    s.set(43)
    s.set(44)
    assert.same([42, 43, 44], results)
  })

  test("Emits changes from parent", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
    observe((v) => {
      results.push(v)
    })(s)
    parent.set({ x: { x: 43 } })
    x.set({ x: 44 })
    assert.same([42, 43, 44], results)
  })

  test("Parent emits changes", () => {
    const x = parent.sub("x")
    const s = x.sub("x")
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
    const x = parent.sub("x")
    const s = x.sub("x")

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
})
