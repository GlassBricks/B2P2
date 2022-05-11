import { FactorioJsx } from "../../lib/factoriojsx"
import { state } from "../../lib/observable"
import { asFunc } from "../../lib/test-util/func"
import { testRender } from "../../lib/test-util/gui"
import { Fn } from "./Fn"

test("fn", () => {
  const val = state("one")
  const wrapper = testRender(
    <Fn
      from={val}
      uses="flow"
      map={asFunc((x) => (
        <label caption={x} />
      ))}
    />,
  )
  function findLabels() {
    return wrapper.findAll("label").map((x) => x.native.caption)
  }

  assert.same(["one"], findLabels())
  val.set("two")
  assert.same(["two"], findLabels())
})
