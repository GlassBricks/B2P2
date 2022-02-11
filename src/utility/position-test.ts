import { pos } from "./position"
import { pair, unpair } from "./number-pair"
import { bbox } from "./bounding-box"
import { DOWN, LEFT, RIGHT, UP } from "./rotation"

describe("position", () => {
  test("create", () => {
    const position = pos(1, 2)
    assert.same({ x: 1, y: 2 }, position)
  })

  test("loada", () => {
    const position = { x: 3, y: 4 }
    pos.loada(position)
    assert.equal(5, position.length())
  })

  test("loadr", () => {
    const position = pos.load({ x: 3, y: 4 })
    assert.equal(5, position.length())
  })

  test("add", () => {
    const position = pos(1, 2)
    const position2 = pos(3, 4)
    const position3 = position.add(position2)
    assert.same({ x: 4, y: 6 }, position3)
  })

  test("sub", () => {
    const position = pos(1, 2)
    const position2 = pos(3, 4)
    const position3 = position.sub(position2)
    assert.same({ x: -2, y: -2 }, position3)
  })

  test("times", () => {
    const position = pos(1, 2)
    const position2 = position.times(2)
    assert.same({ x: 2, y: 4 }, position2)
  })

  test("div", () => {
    const position = pos(1, 2)
    const position2 = position.div(2)
    assert.same({ x: 0.5, y: 1 }, position2)
  })

  test("emul", () => {
    const position = pos(1, 2)
    const position2 = pos(3, 4)
    const position3 = position.emul(position2)
    assert.same({ x: 3, y: 8 }, position3)
  })

  test("ediv", () => {
    const position = pos(1, 2)
    const position2 = pos(3, 4)
    const position3 = position.ediv(position2)
    assert.same({ x: 1 / 3, y: 0.5 }, position3)
  })

  test("floor", () => {
    const position = pos(1.5, 2.5)
    const position2 = position.floor()
    assert.same({ x: 1, y: 2 }, position2)
  })

  test("ceil", () => {
    const position = pos(1.5, 2.5)
    const position2 = position.ceil()
    assert.same({ x: 2, y: 3 }, position2)
  })

  describe("rotateAboutOrigin", () => {
    test("north", () => {
      const position = pos(1, 2)
      const position2 = position.rotateAboutOrigin(UP)
      assert.same({ x: 1, y: 2 }, position2)
    })

    test("south", () => {
      const position = pos(1, 2)
      const position2 = position.rotateAboutOrigin(DOWN)
      assert.same({ x: -1, y: -2 }, position2)
    })

    test("west", () => {
      const position = pos(1, 2)
      const position2 = position.rotateAboutOrigin(LEFT)
      assert.same({ x: 2, y: -1 }, position2)
    })

    test("east", () => {
      const position = pos(1, 2)
      const position2 = position.rotateAboutOrigin(RIGHT)
      assert.same({ x: -2, y: 1 }, position2)
    })
  })

  test("length", () => {
    const position = pos(3, 4)
    assert.equal(5, position.length())
  })

  test("pair", () => {
    const position = pos(3, 4)
    const pair = position.pair()
    const [x, y] = unpair(pair)
    assert.equal(3, x)
    assert.equal(4, y)
  })

  test("fromPair", () => {
    const p = pair(3, 4)
    const position = pos.fromPair(p)
    assert.same({ x: 3, y: 4 }, position)
  })
})

describe("bounding box", () => {
  test("create", () => {
    const box = bbox({ x: 1, y: 2 }, { x: 3, y: 4 })
    assert.same({ x: 1, y: 2 }, box.left_top)
    assert.same({ x: 3, y: 4 }, box.right_bottom)
  })

  test("shift", () => {
    const box = bbox({ x: 1, y: 2 }, { x: 3, y: 4 })
    const box2 = box.shift({ x: 1, y: 1 })
    assert.same({ x: 2, y: 3 }, box2.left_top)
    assert.same({ x: 4, y: 5 }, box2.right_bottom)
  })

  test("roundTile", () => {
    const box = bbox({ x: 1.5, y: 2.5 }, { x: 3.5, y: 4.5 })
    const box2 = box.roundTile()
    assert.same({ x: 1, y: 2 }, box2.left_top)
    assert.same({ x: 4, y: 5 }, box2.right_bottom)
  })

  test("roundTileConservative", () => {
    const box = bbox({ x: 0.9, y: 2.5 }, { x: 3.5, y: 4.1 })
    const box2 = box.roundTileConservative()
    assert.same({ x: 1, y: 2 }, box2.left_top)
    assert.same({ x: 4, y: 4 }, box2.right_bottom)
  })

  test("scale", () => {
    const box = bbox({ x: 1, y: 2 }, { x: 3, y: 4 })
    const box2 = box.scale(2)
    assert.same({ x: 2, y: 4 }, box2.left_top)
    assert.same({ x: 6, y: 8 }, box2.right_bottom)
  })

  test("center", () => {
    const box = bbox({ x: 1, y: 2 }, { x: 3, y: 4 })
    const box2 = box.center()
    assert.same({ x: 2, y: 3 }, box2)
  })

  describe("rotateAboutOrigin", () => {
    test("north", () => {
      const box = bbox({ x: -1, y: -2 }, { x: 3, y: 4 })
      const box2 = box.rotateAboutOrigin(UP)
      assert.same({ x: -1, y: -2 }, box2.left_top)
      assert.same({ x: 3, y: 4 }, box2.right_bottom)
    })

    test("south", () => {
      const box = bbox({ x: -1, y: -2 }, { x: 3, y: 4 })
      const box2 = box.rotateAboutOrigin(DOWN)
      assert.same({ x: -3, y: -4 }, box2.left_top)
      assert.same({ x: 1, y: 2 }, box2.right_bottom)
    })

    test("west", () => {
      const box = bbox({ x: -1, y: -2 }, { x: 3, y: 4 })
      const box2 = box.rotateAboutOrigin(LEFT)
      assert.same({ x: -2, y: -3 }, box2.left_top)
      assert.same({ x: 4, y: 1 }, box2.right_bottom)
    })

    test("east", () => {
      const box = bbox({ x: -1, y: -2 }, { x: 3, y: 4 })
      const box2 = box.rotateAboutOrigin(RIGHT)
      assert.same({ x: -4, y: -1 }, box2.left_top)
      assert.same({ x: 2, y: 3 }, box2.right_bottom)
    })
  })
})

test("iterateTiles", () => {
  const box = bbox({ x: 1, y: 2 }, { x: 3, y: 4 })
  const result = []
  for (const pos of box.iterateTiles()) {
    result.push(pos)
  }
  assert.same(
    [
      [1, 2],
      [2, 2],
      [1, 3],
      [2, 3],
    ],
    result,
  )
})

test("around", () => {
  const box = bbox.around({ x: 1, y: 1 }, 1)
  assert.same({ x: 0, y: 0 }, box.left_top)
  assert.same({ x: 2, y: 2 }, box.right_bottom)
})
