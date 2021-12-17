import { getPlayer } from "../testUtil"
import { ChooseElemButtonElementSpec, FlowElementSpec } from "./ElementSpec"
import { create, destroy } from "./Element"
import { state, testSource } from "../callbags"

describe("creating and destroying elements", () => {
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

  test("Listens to source property", () => {
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

  test("Does not allow source on create-only property", () => {
    const v = state<"vertical" | "horizontal">("vertical")
    const spec: FlowElementSpec = {
      type: "flow",
      direction: v as any,
    }
    assert.error(() => {
      element = create(parent, spec).nativeElement
    })
  })

  test("Can specify children", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      children: [
        {
          type: "button",
          caption: "hi",
        },
      ],
    }
    element = create(parent, spec).nativeElement
    assert.equal("button", element.children[0].type)
    assert.equal("hi", element.children[0].caption)
  })

  test("calling destroy destroys native element", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const el = create(parent, spec)
    element = el.nativeElement as FlowGuiElement
    destroy(el)
    assert.is_false(element.valid)
  })

  test("calling destroy ends subscriptions", () => {
    const source = testSource<string>()
    const spec: FlowElementSpec = {
      type: "flow",
      caption: source,
    }
    const el = create(parent, spec)
    assert.is_false(source.ended)
    destroy(el)
    assert.is_true(source.ended)
  })

  test("calling destroy ends child subscriptions", () => {
    const source = testSource<string>()
    const spec: FlowElementSpec = {
      type: "flow",
      children: [
        {
          type: "flow",
          children: [
            {
              type: "button",
              caption: source,
            },
          ],
        },
      ],
    }
    const el = create(parent, spec)
    assert.is_false(source.ended)
    destroy(el)
    assert.is_true(source.ended)
  })
})
