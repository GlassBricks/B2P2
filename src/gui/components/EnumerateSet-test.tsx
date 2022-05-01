import { MutableObservableSet, observableSet } from "../../lib/observable/ObservableSet"
import { ElementWrapper, testRender } from "../../lib/test-util/gui"
import { FactorioJsx, Spec } from "../../lib/factoriojsx"
import { EnumerateSet } from "./EnumerateSet"
import { asFunc } from "../../lib/test-util/args"
import { returns } from "../../lib"
import { MutableObservableList, observableList } from "../../lib/observable/ObservableList"
import { List } from "./List"

function presentElements(wrapper: ElementWrapper) {
  return wrapper.findAll("label").map((x) => x.native.caption)
}
describe("EnumerateSet", () => {
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
})

describe("ObservableSet ifEmpty", () => {
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

describe("ObservableList", () => {
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
})

describe("ObservableList ifEmpty", () => {
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
