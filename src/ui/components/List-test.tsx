import { returns } from "../../lib"
import { FactorioJsx, Spec } from "../../lib/factoriojsx"
import { MutableObservableList, observableList } from "../../lib/observable"
import { asFunc } from "../../lib/test-util/func"
import { ElementWrapper, testRender } from "../../lib/test-util/gui"
import { List } from "./List"

function presentElements(wrapper: ElementWrapper) {
  return wrapper.findAll("label").map((x) => x.native.caption)
}
let array: MutableObservableList<string>
let spec: Spec
before_each(() => {
  array = observableList()
  spec = (
    <List
      uses="flow"
      of={array}
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
  array.push("a")
  array.push("b")
  const wrapper = testRender(spec)
  assert.same(["a", "b"], presentElements(wrapper))
})

it("adds elements", () => {
  const wrapper = testRender(spec)
  array.push("a")
  array.push("b")
  assert.same(
    ["a", "b"],
    wrapper.findAll("label").map((x) => x.native.caption),
  )
})

it("inserts elements", () => {
  const wrapper = testRender(spec)
  array.push("a")
  array.push("b")
  array.insert(1, "c")
  assert.same(
    ["a", "c", "b"],
    wrapper.findAll("label").map((x) => x.native.caption),
  )
})

it("removes elements", () => {
  const wrapper = testRender(spec)
  array.push("a")
  array.push("b")
  array.remove(0)
  assert.same(["b"], presentElements(wrapper))
})

it("swaps elements", () => {
  const wrapper = testRender(spec)
  array.push("a")
  array.push("b")
  array.swap(0, 1)
  assert.same(
    ["b", "a"],
    wrapper.findAll("label").map((x) => x.native.caption),
  )
})

it("changes elements", () => {
  const wrapper = testRender(spec)
  array.push("a")
  array.push("b")
  array.set(0, "c")
  assert.same(
    ["c", "b"],
    wrapper.findAll("label").map((x) => x.native.caption),
  )
})

describe("ifEmpty", () => {
  let array: MutableObservableList<string>
  let spec: Spec
  before_each(() => {
    array = observableList()
    spec = (
      <List
        uses="flow"
        of={array}
        map={asFunc((v) => (
          <label caption={v} />
        ))}
        ifEmpty={returns(<label caption="empty" />)}
      />
    )
  })

  it("is present if empty", () => {
    const wrapper = testRender(spec)
    assert.same(["empty"], presentElements(wrapper))
  })

  it("is not present if not empty", () => {
    array.push("a")
    const wrapper = testRender(spec)
    assert.same(["a"], presentElements(wrapper))
  })

  it("is present if made empty", () => {
    array.push("a")
    const wrapper = testRender(spec)
    array.remove(0)
    assert.same(["empty"], presentElements(wrapper))
  })

  it("is not present if made non-empty", () => {
    const wrapper = testRender(spec)
    array.push("a")
    assert.same(["a"], presentElements(wrapper))
  })
})
