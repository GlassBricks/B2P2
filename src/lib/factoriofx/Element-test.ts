import { getPlayer } from "../testUtil"
import { ChooseElemButtonElementSpec, FlowElementSpec, SliderElementSpec } from "./types"
import { create, destroy, getInstance } from "./Element"
import { state, testSource } from "../callbags"

let parent: LuaGuiElement
let element: LuaGuiElement | undefined | true
before_each(() => {
  parent = getPlayer().gui.screen
  element = undefined
})
after_each(() => {
  if (!element) error("element value not set")
  if (element !== true) destroy(element)
  element = undefined
})

describe("create", () => {
  test("Creates gettable instance", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const el = create(parent, spec)
    element = el.nativeElement
    assert.equal(el, getInstance(element))
  })

  test("Sets spec property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    element = create(parent, spec).nativeElement
    assert.same("vertical", element.direction)
  })

  test("Sets element property", () => {
    const spec: ChooseElemButtonElementSpec = {
      type: "choose-elem-button",
      elem_type: "item",
      locked: true,
    }
    element = create(parent, spec).nativeElement
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

  test("aliased property", () => {
    const elemFilters: ItemPrototypeFilter[] = [
      {
        filter: "name",
        name: "iron-plate",
      },
    ]
    const spec: ChooseElemButtonElementSpec = {
      type: "choose-elem-button",
      elem_type: "item",
      elem_filters: elemFilters,
    }
    element = create(parent, spec).nativeElement
    assert.same(elemFilters, element.elem_filters)
  })

  test("Call method property", () => {
    const value = state(1)
    const spec: SliderElementSpec = {
      type: "slider",
      value_step: value,
    }
    element = create(parent, spec).nativeElement
    assert.equal(1, element.get_slider_value_step())
    value.set(2)
    assert.equal(2, element.get_slider_value_step())
  })

  test("Slider minimum", () => {
    const value = state(1)
    const spec: SliderElementSpec = {
      type: "slider",
      minimum_value: value,
      maximum_value: 5,
    }
    element = create(parent, spec).nativeElement
    assert.equal(1, element.get_slider_minimum())
    assert.equal(5, element.get_slider_maximum())
    value.set(2)
    assert.equal(2, element.get_slider_minimum())
    assert.equal(5, element.get_slider_maximum())
  })

  test("Slider maximum", () => {
    const value = state(5)
    const spec: SliderElementSpec = {
      type: "slider",
      minimum_value: 1,
      maximum_value: value,
    }
    element = create(parent, spec).nativeElement
    assert.equal(1, element.get_slider_minimum())
    assert.equal(5, element.get_slider_maximum())
    value.set(6)
    assert.equal(1, element.get_slider_minimum())
    assert.equal(6, element.get_slider_maximum())
  })

  test("Does not allow source on create-only property", () => {
    const v = state<"vertical" | "horizontal">("vertical")
    const spec: FlowElementSpec = {
      type: "flow",
      direction: v as any,
    }
    element = true
    assert.error(() => {
      element = create(parent, spec).nativeElement
    })
  })

  test("can specify children", () => {
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
})

describe("styleMod", () => {
  test("sets property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      styleMod: {
        left_padding: 3,
      },
    }
    element = create(parent, spec).nativeElement
    assert.equals(3, element.style.left_padding)
  })

  test("sets setter property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      styleMod: {
        padding: [3, 3],
      },
    }
    element = create(parent, spec).nativeElement
    assert.equals(3, element.style.left_padding)
  })

  test("listens to source property", () => {
    const value = state(1)
    const spec: FlowElementSpec = {
      type: "flow",
      styleMod: {
        padding: value,
      },
    }
    element = create(parent, spec).nativeElement
    assert.equals(1, element.style.left_padding)
    value.set(2)
    assert.equals(2, element.style.left_padding)
  })
})

describe("destroy", () => {
  test("calling destroy sets invalid to false", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const el = create(parent, spec)
    element = el.nativeElement
    destroy(el)
    assert.is_false(el.valid)
  })

  test("calling destroy destroys native element", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const el = create(parent, spec)
    element = el.nativeElement
    destroy(el)
    assert.is_false(element.valid)
  })

  test("can call destroy on native element", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const el = create(parent, spec)
    element = el.nativeElement
    destroy(element)
    assert.is_false(element.valid)
    assert.is_false(el.valid)
  })

  test("calling destroy ends subscriptions", () => {
    const source = testSource<string>()
    const spec: FlowElementSpec = {
      type: "flow",
      caption: source,
    }
    const el = create(parent, spec)
    element = el.nativeElement
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
    element = el.nativeElement
    assert.is_false(source.ended)
    destroy(el)
    assert.is_true(source.ended)
  })
})
