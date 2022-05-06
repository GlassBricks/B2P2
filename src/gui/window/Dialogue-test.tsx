import { destroy } from "../../lib/factoriojsx"
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

test.only("title and content", () => {
  showDialogue(player, {
    title: "title",
    message: "content",
    backCaption: "back",
  })
  async()
  after_ticks(2, () => {
    const dialogue = getDialogue()
    assert.equal("title", dialogue.native.caption)
    dialogue.findSatisfying((x) => x.caption === "content")
    done()
  })
})

test("back button", () => {
  const onBack = spy<any>()
  showDialogue(player, {
    title: "title",
    message: "content",
    backCaption: "back",
    onBack,
  })
  async()
  after_ticks(2, () => {
    const dialogue = getDialogue()
    dialogue
      .findSatisfying((x) => x.type === "button" && x.style.name === "back_button" && x.caption === "back")
      .simulateClick()
    assert.spy(onBack).called()
    done()
  })
})

test("confirm button", () => {
  const onConfirm = spy<any>()
  showDialogue(player, {
    title: "title",
    message: "content",
    confirmCaption: "confirm",
    onConfirm,
  })
  async()
  after_ticks(2, () => {
    const dialogue = getDialogue()
    dialogue
      .findSatisfying((x) => x.type === "button" && x.style.name === "confirm_button" && x.caption === "confirm")
      .simulateClick()
    assert.spy(onConfirm).called()
    done()
  })
})
