import { MutableObservableSet, observableSet } from "../observable/ObservableSet"
import { ElementWrapper, testRender } from "../test-util/gui"
import { FactorioJsx, Spec } from "../factoriojsx"
import { Enumerate } from "./Enumerate"

let set: MutableObservableSet<string>
let spec: Spec
before_each(() => {
  set = observableSet()
  spec = <Enumerate set={set} map={(v) => <label caption={v} />} />
})

function presentElements(wrapper: ElementWrapper) {
  return wrapper.findAll("label").map((x) => x.native.caption)
}

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

it("listens to added elements", () => {
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
