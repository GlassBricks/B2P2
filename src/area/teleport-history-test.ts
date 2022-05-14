import { pos } from "../lib/geometry"
import { getPlayer } from "../lib/test-util/misc"
import { NavigationHistory, teleportBackward, teleportForward, teleportPlayer } from "./teleport-history"

describe("navigation history", () => {
  let history: NavigationHistory<number>
  before_each(() => {
    history = new NavigationHistory(10)
  })

  test("push", () => {
    history.push2(1, 2)
    assert.is_nil(history.next())
    assert.equal(1, history.prev())
    assert.is_nil(history.prev())
    assert.equal(2, history.next())
    assert.is_nil(history.next())
  })

  test("push 2", () => {
    history.push2(1, 2)
    history.push2(3, 4)
    assert.equal(3, history.prev())
    assert.equal(2, history.prev())
    assert.equal(1, history.prev())
    assert.is_nil(history.prev())
    assert.equal(2, history.next())
    assert.equal(3, history.next())
    assert.equal(4, history.next())
    assert.is_nil(history.next())
  })

  test("push after undo", () => {
    history.push2(1, 2)
    history.push2(3, 4)
    assert.equal(3, history.prev())
    history.push2(5, 6)
    assert.equal(5, history.prev())
    assert.equal(3, history.prev())
    assert.equal(2, history.prev())
    assert.equal(1, history.prev())
    assert.is_nil(history.prev())
    assert.equal(2, history.next())
    assert.equal(3, history.next())
    assert.equal(5, history.next())
    assert.equal(6, history.next())
  })

  test("beyond capacity", () => {
    history.maxSize = 5
    for (let i = 1; i < 10; i += 2) {
      history.push2(i, i + 1)
    }
    for (let i = 9; i >= 6; i--) {
      assert.equal(i, history.prev())
    }
    assert.is_nil(history.prev())
    for (let i = 7; i <= 10; i++) {
      assert.equal(i, history.next())
    }
    assert.is_nil(history.next())
  })

  test("filter", () => {
    for (let i = 1; i < 10; i += 2) {
      history.push2(i, i + 1)
    }
    history.filter((i) => i % 2 === 0)
    for (let i = 8; i >= 2; i -= 2) {
      assert.equal(i, history.prev())
    }
    assert.is_nil(history.prev())
    for (let i = 4; i <= 10; i += 2) {
      assert.equal(i, history.next())
    }
    assert.is_nil(history.next())
  })

  test("filter after undo", () => {
    history.maxSize = 10
    for (let i = 1; i < 10; i += 2) {
      history.push2(i, i + 1)
    }
    for (let i = 9; i >= 6; i--) {
      assert.equal(i, history.prev())
    }
    // next undo is 5, next redo is 7
    history.filter((i) => i % 2 === 0)
    assert.equal(8, history.next())
    assert.equal(6, history.prev())
    assert.equal(4, history.prev())
  })
})

describe("teleporting", () => {
  let player: LuaPlayer
  before_all(() => {
    player = getPlayer()
  })
  test("teleport", () => {
    player.teleport(pos(0, 0)) // manual movement
    teleportPlayer(player, player.surface, pos(1, 1))
    assert.same(pos(1, 1), player.position, "teleports to position")

    player.teleport(pos(2, 2)) // manual movement
    teleportPlayer(player, player.surface, pos(3, 3))
    assert.same(pos(3, 3), player.position, "teleports to position")

    teleportBackward(player)
    assert.same(pos(2, 2), player.position, "teleports back to place before teleport")

    teleportBackward(player)
    assert.same(pos(1, 1), player.position, "teleports back to last teleport")

    teleportBackward(player)
    assert.same(pos(0, 0), player.position, "teleports back to original position")

    teleportForward(player)
    assert.same(pos(1, 1), player.position, "teleports forward to first teleport")

    teleportForward(player)
    assert.same(pos(2, 2), player.position, "teleports forward to place before next teleport")

    teleportForward(player)
    assert.same(pos(3, 3), player.position, "teleports forward to next teleport")
  })
})
