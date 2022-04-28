import { destroy, FactorioJsx } from "../../lib/factoriojsx"
import { showDialogue } from "./Dialogue"
import { getPlayer } from "../../lib/test-util/misc"
import { ElementWrapper } from "../../lib/test-util/gui"

let player: LuaPlayer
before_all(() => {
  player = getPlayer()
})
after_each(() => {
  if (player.opened && player.opened.object_name === "LuaGuiElement") {
    destroy(player.opened)
  }
})

function getDialogue(): ElementWrapper {
  const opened = player.opened
  assert.equal("LuaGuiElement", opened?.object_name)
  return new ElementWrapper(opened as LuaGuiElement)
}

test("title and content", () => {
  showDialogue(player, {
    title: "title",
    content: <label caption={"content"} />,
    backCaption: "back",
  })
  const dialogue = getDialogue()
  assert.equal("title", dialogue.native.caption)
  dialogue.findSatisfying((x) => x.caption === "content")
})

test("back button", () => {
  const onBack = spy<any>()
  showDialogue(player, {
    title: "title",
    content: <label caption={"content"} />,
    backCaption: "back",
    onBack,
  })
  const dialogue = getDialogue()
  dialogue
    .findSatisfying((x) => x.type === "button" && x.style.name === "back_button" && x.caption === "back")
    .simulateClick()
  assert.spy(onBack).called()
})

test("confirm button", () => {
  const onConfirm = spy<any>()
  showDialogue(player, {
    title: "title",
    content: <label caption={"content"} />,
    confirmCaption: "confirm",
    onConfirm,
  })
  const dialogue = getDialogue()
  dialogue
    .findSatisfying((x) => x.type === "button" && x.style.name === "confirm_button" && x.caption === "confirm")
    .simulateClick()
  assert.spy(onConfirm).called()
})
