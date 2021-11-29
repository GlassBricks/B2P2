import { getPlayer } from "../testUtil"
import { ElementInstance } from "./ElementInstance"
import { SimpleProperty } from "../value"

let player: LuaPlayer
let screen: LuaGuiElement
const name = " -- test  element -- "
before_each(() => {
  player = getPlayer()
  screen = player.gui.screen
})
after_each(() => {
  screen[name]?.destroy()
})

test("create", () => {
  const instance = new ElementInstance(screen, {
    type: "flow",
    name,
  })
  const element = screen[name]
  assert.not_nil(element)
  assert.equal("flow", element!.type)
  assert.equal(name, element!.name)
})

test("create with props", () => {
  const instance = new ElementInstance(screen, {
    type: "flow",
    name,
    ignored_by_interaction: true,
  })
  const element = screen[name]
  assert.is_true(element!.ignored_by_interaction)
})

test("create with observable value prop", () => {
  const prop = new SimpleProperty("Hello")
  const instance = new ElementInstance(screen, {
    type: "button",
    name,
    caption: prop,
  })
  const element = screen[name]!
  assert.equal(prop.get(), element.caption)
  prop.set("World")
  assert.equal(prop.get(), element.caption)
})
