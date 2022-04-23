import { FlowElementSpec } from "../factoriojsx"
import { addWindow, Window } from "./Window"
import { getPlayer } from "../test-util/misc"

const spec: FlowElementSpec = { type: "flow", tags: { isTestWindow: true } }

let window: Window
let player: LuaPlayer
before_each(() => {
  window = addWindow("test", spec)
  player = getPlayer()
})

after_all(() => {
  window.close(player)
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
  assert.false(window.isOpen(player))
})

test("open", () => {
  window.open(player)
  assert.true(testWindowFound())
  assert.true(window.isOpen(player))
})

test("close when not open", () => {
  window.close(player)
})

test("close", () => {
  window.open(player)
  window.close(player)
  assert.false(testWindowFound())
  assert.false(window.isOpen(player))
})

test("toggle to open", () => {
  window.toggle(player)
  assert.true(testWindowFound())
  assert.true(window.isOpen(player))
})

test("toggle to close", () => {
  window.open(player)
  window.toggle(player)
  assert.false(testWindowFound())
  assert.false(window.isOpen(player))
})

test("openOrRefresh: open", () => {
  window.openOrRefresh(player)
  assert.true(testWindowFound())
  assert.true(window.isOpen(player))
})

test("openOrRefresh: refresh", () => {
  window.open(player)
  const oldGui = findTestWindow()!
  window.openOrRefresh(player)
  assert.is_false(oldGui.valid)
  const newGui = findTestWindow()!
  assert.is_true(newGui.valid)
})

test("refreshIfOpen", () => {
  window.open(player)
  const oldGui = findTestWindow()!
  window.refreshIfOpen(player)
  assert.is_false(oldGui.valid)
  const newGui = findTestWindow()!
  assert.is_true(newGui.valid)
})
