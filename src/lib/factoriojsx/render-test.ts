// noinspection UnnecessaryLocalVariableJS

import { Classes } from "../references"
import { destroy } from "./render"
import {
  ButtonElementSpec,
  ChooseElemButtonElementSpec,
  ClassComponentSpec,
  Component,
  FCSpec,
  FlowElementSpec,
  SliderElementSpec,
  TextBoxElementSpec,
} from "./spec"
import { state, TestObservable } from "../observable"
import { testRender } from "../test-util/gui"

describe("create", () => {
  test("Sets spec property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      direction: "vertical",
    }
    const element = testRender(spec).native
    assert.same("vertical", element.direction)
  })

  test("Sets element property", () => {
    const spec: ChooseElemButtonElementSpec = {
      type: "choose-elem-button",
      elem_type: "item",
      locked: true,
    }
    const element = testRender(spec).native
    assert.is_true(element.locked)
  })

  test("Listens to source property", () => {
    const v = state<LocalisedString>("one")
    const spec: FlowElementSpec = {
      type: "flow",
      caption: v,
    }
    const element = testRender(spec).native
    assert.equal("one", element.caption)
    v.set("two")
    assert.equal("two", element.caption)
  })

  test("Call method property", () => {
    const value = state(1)
    const spec: SliderElementSpec = {
      type: "slider",
      value_step: value,
    }
    const element = testRender(spec).native
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
    const element = testRender(spec).native
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
    const element = testRender(spec).native
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
    assert.error(() => {
      testRender(spec)
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
    const element = testRender(spec).native
    assert.equal("button", element.children[0].type)
    assert.equal("hi", element.children[0].caption)
  })

  test("can specify multiple children", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      children: [
        {
          type: "button",
          caption: "hi",
        },
        {
          type: "button",
          caption: "bye",
        },
      ],
    }
    const element = testRender(spec).native
    assert.equal("button", element.children[0].type)
    assert.equal("hi", element.children[0].caption)
    assert.equal("button", element.children[1].type)
    assert.equal("bye", element.children[1].caption)
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
    const element = testRender(spec).native
    assert.equals(3, element.style.left_padding)
  })

  test("sets setter property", () => {
    const spec: FlowElementSpec = {
      type: "flow",
      styleMod: {
        padding: [3, 3],
      },
    }
    const element = testRender(spec).native
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
    const element = testRender(spec).native
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
    const element = testRender(spec).native
    destroy(element)
    assert.is_false(element.valid)
  })

  test("calling destroy ends subscriptions", () => {
    const source = new TestObservable("hi")
    const spec: FlowElementSpec = {
      type: "flow",
      caption: source,
    }
    const element = testRender(spec).native
    assert.spy(source.unsubscribe).not_called()
    destroy(element)
    assert.spy(source.unsubscribe).called()
  })

  test("calling destroy ends child subscriptions", () => {
    const source = new TestObservable("hi")
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
    const element = testRender(spec).native

    assert.spy(source.unsubscribe).not_called()
    destroy(element)
    assert.spy(source.unsubscribe).called()
  })
})

test("events", () => {
  const func = spy<(this: any) => void>()
  const spec: ButtonElementSpec = {
    type: "button",
    on_gui_click: func,
    on_gui_opened: func,
  }
  const element = testRender(spec).native

  assert.spy(func).not_called()

  const fakeClickEvent: OnGuiClickEvent = {
    element: element as LuaGuiElement,
    name: defines.events.on_gui_click,
    player_index: element.player_index,
    tick: game.tick,
    alt: false,
    button: defines.mouse_button_type.left,
    control: false,
    shift: false,
  }
  script.get_event_handler(defines.events.on_gui_click)(fakeClickEvent)
  assert.spy(func).called_with(fakeClickEvent)

  const fakeOpenEvent: OnGuiOpenedEvent = {
    element: element as LuaGuiElement,
    name: defines.events.on_gui_opened,
    player_index: element.player_index,
    tick: game.tick,
    gui_type: defines.gui_type.custom,
  }
  script.get_event_handler(defines.events.on_gui_opened)(fakeOpenEvent)
  assert.spy(func).called_with(fakeOpenEvent)
})

test("state", () => {
  const val = state("one")
  const spec: TextBoxElementSpec = {
    type: "text-box",
    text: val,
  }
  const element = testRender(spec).native

  assert.same("one", val.get())
  assert.same("one", element.text)

  element.text = "two"
  const fakeEvent: OnGuiTextChangedEvent = {
    element: element as LuaGuiElement,
    name: defines.events.on_gui_text_changed,
    player_index: element.player_index,
    tick: game.tick,
    text: element.text,
  }
  script.get_event_handler(defines.events.on_gui_text_changed)(fakeEvent)

  assert.same("two", val.get())

  val.set("three")
  assert.same("three", element.text)
})

test("onCreate", () => {
  let element1: unknown
  const spec: FlowElementSpec = {
    type: "flow",
    onCreate(e) {
      element1 = e
    },
  }

  const element = testRender(spec).native
  assert.equal(element1, element)
})

test("function component", () => {
  const results: unknown[] = []
  function Component(props: { cb: (element: GuiElementMembers) => void }): FlowElementSpec {
    results.push("called")
    return {
      type: "flow",
      onCreate: props.cb,
    }
  }

  const cb = (element: GuiElementMembers) => {
    results.push(element.type)
  }

  const spec: FCSpec<any> = {
    type: Component,
    props: { cb },
  }
  const element = testRender(spec).native

  assert.equal("flow", element.type)
  assert.same(["called", "flow"], results)
})

describe("Class component", () => {
  const results: unknown[] = []

  @Classes.register()
  class Foo implements Component<{ cb: (element: GuiElementMembers) => void }> {
    declare props: { cb: (element: GuiElementMembers) => void }
    constructor() {
      results.push("constructed")
    }

    render(): FlowElementSpec {
      results.push("called")
      return {
        type: "flow",
        onCreate: this.props.cb,
      }
    }
  }

  test("Create", () => {
    const cb = (element: GuiElementMembers) => {
      results.push(element.type)
    }

    const spec: ClassComponentSpec<any> = {
      type: Foo,
      props: { cb },
    }
    const element = testRender(spec).native

    assert.equal("flow", element.type)
    assert.same(["constructed", "called", "flow"], results)
  })
})
