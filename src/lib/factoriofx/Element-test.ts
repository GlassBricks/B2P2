import { getPlayer } from "../testUtil"
import { ChooseElemButtonElementSpec, FlowElementSpec } from "./ElementSpec"
import { create } from "./Element"
import { state } from "../callbags/state"

describe("creating element", () => {
  let parent: LuaGuiElement
  let element: LuaGuiElement | undefined
  before_each(() => {
    parent = getPlayer().gui.screen
    element = undefined
  })
  after_each(() => {
    element?.destroy()
    element = undefined
  })

  test("Sets spec property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    element = create(parent, spec).nativeElement as FlowGuiElement
    assert.same("vertical", element.direction)
  })

  test("Sets element property", () => {
    const spec: ChooseElemButtonElementSpec = {
      type: "choose-elem-button",
      elem_type: "item",
      locked: true,
    }
    element = create(parent, spec).nativeElement as ChooseElemButtonGuiElement
    assert.is_true(element.locked)
  })

  test("Source property", () => {
    const v = state<LocalisedString>("one")
    const spec: FlowElementSpec = {
      type: "flow",
      caption: v,
    }
    element = create(parent, spec).nativeElement
    assert.equal("one", element.caption)
    v.set("two")
    assert.equal("two", element.caption)
  })
})
