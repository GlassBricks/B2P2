import { returns } from "../../lib"
import { FactorioJsx } from "../../lib/factoriojsx"
import { MutableState, state } from "../../lib/observable"
import { ElementWrapper, testRender } from "../../lib/test-util/gui"
import { If } from "./If"

let condition: MutableState<boolean>

before_each(() => {
  condition = state(true)
})

function findAllLabels(root: ElementWrapper): LocalisedString[] {
  return root.findAllSatisfying((x) => x.type === "label").map((x) => x.native.caption)
}

test("single then", () => {
  const component = testRender(<If condition={condition} then={returns(<label caption="true" />)} />)
  assert.same(["true"], findAllLabels(component))

  condition.set(false)
  assert.same([], findAllLabels(component))
})

test("then and else", () => {
  const component = testRender(
    <If condition={condition} then={returns(<label caption="true" />)} else={returns(<label caption="false" />)} />,
  )
  assert.same(["true"], findAllLabels(component))

  condition.set(false)
  assert.same(["false"], findAllLabels(component))
})
