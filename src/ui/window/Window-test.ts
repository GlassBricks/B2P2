import { Classes } from "../../lib"
import { Spec } from "../../lib/factoriojsx"
import { getPlayer } from "../../lib/test-util/misc"
import { Window } from "./Window"

@Classes.register("test-window")
class TestWindow extends Window {
  render(): Spec {
    return { type: "flow", tags: { isTestWindow: true } }
  }
}
let player: LuaPlayer
before_each(() => {
  player = getPlayer()
})

after_all(() => {
  TestWindow.close(player)
})

function findTestWindow() {
  for (const child of player.gui.screen.children) {
    if (child.tags.isTestWindow) return child
  }
  return undefined
}

function testWindowFound() {
  return findTestWindow() !== undefined
}

test("isOpen starts as false", () => {
  assert.false(TestWindow.isOpen(player))
})

test("open", () => {
  TestWindow.open(player)
  assert.true(testWindowFound())
  assert.true(TestWindow.isOpen(player))
})

test("open: refresh", () => {
  TestWindow.open(player)
  const oldGui = findTestWindow()!
  TestWindow.open(player)
  assert.is_false(oldGui.valid)
  const newGui = findTestWindow()!
  assert.is_true(newGui.valid)
})

test("close when not open", () => {
  TestWindow.close(player)
})

test("close", () => {
  TestWindow.open(player)
  TestWindow.close(player)
  assert.false(testWindowFound())
  assert.false(TestWindow.isOpen(player))
})

test("toggle to open", () => {
  TestWindow.toggle(player)
  assert.true(testWindowFound())
  assert.true(TestWindow.isOpen(player))
})

test("toggle to close", () => {
  TestWindow.open(player)
  TestWindow.toggle(player)
  assert.false(testWindowFound())
  assert.false(TestWindow.isOpen(player))
})

test("refreshIfOpen", () => {
  TestWindow.open(player)
  const oldGui = findTestWindow()!
  TestWindow.refreshIfOpen(player)
  assert.is_false(oldGui.valid)
  const newGui = findTestWindow()!
  assert.is_true(newGui.valid)
})
