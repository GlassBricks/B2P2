import pipe from "./pipe"
import of from "./of"
import forEach from "./forEach"
import map from "./map"
import { asFunc } from "../testUtil"
import { Talkback } from "./callbag"
import filter from "./filter"
import observe from "./observe"
import { testSource, TestSource } from "./testSource"
import subscribe from "./subscribe"

describe("of and observe", () => {
  test("usage", () => {
    const results: number[] = []
    observe((x: number) => results.push(x))(of(1, 2, 3))
    assert.same([1, 2, 3], results)
  })

  test("messages", () => {
    const actions: [type: number, data: unknown][] = []
    of(
      1,
      2,
      3,
    )(0, (type, data) => {
      if (type === 0) {
        actions.push([type, "greet"])
      } else {
        actions.push([type, data])
      }
    })
    assert.same([[0, "greet"], [1, 1], [1, 2], [1, 3], [2]], actions)
  })

  test("stops on terminate", () => {
    const actions: [type: number, data: unknown][] = []
    let tb: Talkback
    of(
      1,
      2,
      3,
    )(0, (type, data) => {
      if (type === 0) {
        actions.push([type, "greet"])
        tb = data as Talkback
        tb(1)
      } else {
        actions.push([type, data])
        tb(2)
        tb(1)
      }
    })
    assert.same(
      [
        [0, "greet"],
        [1, 1],
      ],
      actions,
    )
  })
})

describe("pipe", () => {
  test("numbers", () => {
    assert.equal(
      4,
      pipe(
        2,
        (x) => x + 3,
        (x) => x * 2,
        (x) => x - 6,
      ),
    )
  })
})

test("map", () => {
  const results: number[] = []
  pipe(
    of(1, 2, 3),
    map(asFunc((x) => x + 1)),
    forEach((x) => results.push(x)),
  )
  assert.same([2, 3, 4], results)
})

test("filter", () => {
  const results: number[] = []
  pipe(
    of(1, 2, 3, 4),
    filter(asFunc((x) => x % 2 === 0)),
    forEach((x) => results.push(x)),
  )
  assert.same([2, 4], results)
})

describe("testSource", () => {
  let results!: number[]
  let source!: TestSource<number>
  before_each(() => {
    results = []
    source = testSource<number>()
  })

  test("Fires given values", () => {
    pipe(
      source,
      observe<number>((x) => results.push(x)),
    )
    assert.is_false(source.ended)
    assert.same([], results)
    source(1, 1)
    assert.is_false(source.ended)
    assert.same([1], results)
  })

  test("ended when called on source", () => {
    let ended = false
    pipe(
      source,
      subscribe({
        data(value) {
          results.push(value as number)
        },
        complete() {
          ended = true
        },
      }),
    )
    assert.is_false(source.ended)
    assert.is_false(ended)
    source(2)
    assert.is_true(source.ended)
    assert.is_true(ended)
    source(1, 3)
    assert.same([], results)
  })

  test("ends when called by sink tb", () => {
    let tb!: Talkback
    source(0, (type, data) => {
      if (type === 0) tb = data as Talkback
      else if (type === 1) results.push(data as number)
    })

    assert.is_false(source.ended)
    tb(2)
    assert.is_true(source.ended)
    source(1, 3)
    assert.same([], results)
  })
})
