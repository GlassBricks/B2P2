import { Classes } from "../references"
import { FactorioJsx } from "./index"
import { Component, Element } from "./spec"

describe("Create simple", () => {
  test("Basic element", () => {
    const el = <flow />
    assert.same(
      {
        type: "flow",
      },
      el,
    )
  })

  test("Basic element with props", () => {
    const el = <flow caption="foo" />

    assert.same({ type: "flow", caption: "foo" }, el)
  })

  test("Basic element with children", () => {
    const el = (
      <flow>
        <flow name="bob" />
      </flow>
    )

    assert.same({ type: "flow", children: [{ type: "flow", name: "bob" }] }, el)
  })

  test("basic element with multiple children", () => {
    const el = (
      <flow>
        <flow name="bob" />
        <flow name="joe" />
      </flow>
    )

    assert.same(
      {
        type: "flow",
        children: [
          { type: "flow", name: "bob" },
          { type: "flow", name: "joe" },
        ],
      },
      el,
    )
  })

  test("basic element with undefined children", () => {
    const el = <flow>{undefined}</flow>
    assert.same({ type: "flow", children: [] }, el)
  })

  function Foo(props: { me?: string; children?: Element }) {
    return <flow caption={props.me}>{props.children}</flow>
  }

  test("Function component", () => {
    const el = <Foo />
    assert.same({ type: Foo, props: {} }, el)
  })

  test("Function component with props", () => {
    const el = <Foo me="bob" />
    assert.same({ type: Foo, props: { me: "bob" } }, el)
  })

  test("Function component with children", () => {
    const el = (
      <Foo>
        <flow name="bob" />
      </Foo>
    )
    assert.same(
      {
        type: Foo,
        props: {
          children: [{ type: "flow", name: "bob" }],
        },
      },
      el,
    )
  })

  @Classes.register()
  class FooClass extends Component<{ me?: string; children?: Element }> {
    render(): Element {
      return <flow caption={this.props.me}>{this.props.children}</flow>
    }
  }

  test("Class component", () => {
    const el = <FooClass />
    assert.same({ type: FooClass, props: {} }, el)
  })

  test("Class component with props", () => {
    const el = <FooClass me="bob" />
    assert.same({ type: FooClass, props: { me: "bob" } }, el)
  })

  test("Class component with children", () => {
    const el = (
      <FooClass>
        <flow name="bob" />
      </FooClass>
    )
    assert.same(
      {
        type: FooClass,
        props: {
          children: [{ type: "flow", name: "bob" }],
        },
      },
      el,
    )
  })
})
