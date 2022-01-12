import { FactorioJsx } from "./index"
import { getPlayer } from "../testUtil"
import { destroy, render } from "./render"
import { Classes } from "../references"
import { Component, Element } from "./spec"

let parent: LuaGuiElement
let element: LuaGuiElement | undefined
before_each(() => {
  parent = getPlayer().gui.screen
  element = undefined
})
after_each(() => {
  if (element) destroy(element)
  element = undefined
})

describe("Create simple", () => {
  test("Basic element", () => {
    const el = render(parent, <flow />)
    element = el.nativeElement

    assert.equal("flow", element.type)
  })

  test("Basic element with props", () => {
    const el = render(parent, <flow caption="foo" />)
    element = el.nativeElement

    assert.equal("foo", element.caption)
  })

  test("Basic element with children", () => {
    const el = render(
      parent,
      <flow>
        <flow name="bob" />
      </flow>,
    )
    element = el.nativeElement

    assert.equal("flow", element.bob!.type)
  })

  function Foo(props: { me?: string; children?: Element }) {
    return <flow caption={props.me}>{props.children}</flow>
  }

  test("Function component", () => {
    const el = render(parent, <Foo />)
    element = el.nativeElement

    assert.equal("flow", element.type)
  })

  test("Function component with props", () => {
    const el = render(parent, <Foo me="foo" />)
    element = el.nativeElement
    assert.equal("foo", element.caption)
  })

  test("Function component with children", () => {
    const el = render(
      parent,
      <Foo>
        <flow name="bob" />
      </Foo>,
    )
    element = el.nativeElement
    assert.equal("flow", element.bob!.type)
  })

  @Classes.registerDefault()
  class FooClass extends Component<{ me?: string; children?: Element }> {
    render(): Element {
      return <flow caption={this.props.me}>{this.props.children}</flow>
    }
  }

  test("Class component", () => {
    const el = render(parent, <FooClass />)
    element = el.nativeElement

    assert.equal("flow", element.type)
  })

  test("Class component with props", () => {
    const el = render(parent, <FooClass me="foo" />)
    element = el.nativeElement

    assert.equal("foo", element.caption)
  })

  test("Class component with children", () => {
    const el = render(
      parent,
      <FooClass>
        <flow name="bob" />
      </FooClass>,
    )
    element = el.nativeElement

    assert.equal("flow", element.bob!.type)
  })
})
