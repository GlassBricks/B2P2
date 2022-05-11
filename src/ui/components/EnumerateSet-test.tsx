import { returns } from "../../lib"
import { FactorioJsx, Spec } from "../../lib/factoriojsx"
import { MutableObservableSet, observableSet } from "../../lib/observable"
import { asFunc } from "../../lib/test-util/func"
import { ElementWrapper, testRender } from "../../lib/test-util/gui"
import { EnumerateSet } from "./EnumerateSet"

function presentElements(wrapper: ElementWrapper) {
  return wrapper.findAll("label").map((x) => x.native.caption)
}
let set: MutableObservableSet<string>
let spec: Spec
before_each(() => {
  set = observableSet()
  spec = (
    <EnumerateSet
      uses="flow"
      of={set}
      map={asFunc((v) => (
        <label caption={v} />
      ))}
    />
  )
})

it("starts empty with no elements", () => {
  const wrapper = testRender(spec)
  assert.same([], presentElements(wrapper))
})

it("creates with initial contents", () => {
  set.add("a")
  set.add("b")
  const wrapper = testRender(spec)
  assert.same(["a", "b"], presentElements(wrapper))
})

it("adds elements", () => {
  const wrapper = testRender(spec)
  set.add("a")
  set.add("b")
  assert.same(
    ["a", "b"],
    wrapper.findAll("label").map((x) => x.native.caption),
  )
})

it("removes elements", () => {
  const wrapper = testRender(spec)
  set.add("a")
  set.add("b")
  set.delete("a")
  assert.same(["b"], presentElements(wrapper))
})

describe("ifEmpty", () => {
  let set: MutableObservableSet<string>
  let spec: Spec
  before_each(() => {
    set = observableSet()
    spec = (
      <EnumerateSet
        uses="flow"
        of={set}
        map={asFunc((v) => (
          <label caption={v} />
        ))}
        ifEmpty={returns(<label caption="empty" />)}
      />
    )
  })

  test("is present if empty", () => {
    const wrapper = testRender(
      <EnumerateSet
        uses="flow"
        of={set}
        map={asFunc((v) => (
          <label caption={v} />
        ))}
        ifEmpty={asFunc(() => (
          <label caption="empty" />
        ))}
      />,
    )
    assert.same(["empty"], presentElements(wrapper))
  })

  test("is not present if not empty", () => {
    set.add("a")
    const wrapper = testRender(spec)
    assert.same(["a"], presentElements(wrapper))
  })

  test("is present if made empty", () => {
    set.add("a")
    const wrapper = testRender(spec)
    set.delete("a")
    assert.same(["empty"], presentElements(wrapper))
  })

  test("is not present if made non-empty", () => {
    const wrapper = testRender(spec)
    set.add("a")
    assert.same(["a"], presentElements(wrapper))
  })
})
