import { testRender } from "../../lib/test-util/gui"
import { FactorioJsx } from "../../lib/factoriojsx"
import { TitleBar } from "./TitleBar"

test("onClose", () => {
  const onClose = spy()
  const element = testRender(<TitleBar title="hi" onClose={onClose} />)
  element.find("sprite-button").simulateClick()
  assert.spy(onClose).called()
})

test("closesParent", () => {
  const element = testRender(
    <frame>
      <TitleBar title="hi" closesParent />
    </frame>,
  )
  element.find("sprite-button").simulateClick()
  assert.false(element.isValid())
})
