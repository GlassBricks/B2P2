import { bound, Classes, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { Assembly } from "../../assembly/Assembly"
import { L_Gui, L_Interaction } from "../../locale"
import { showDialogue } from "../window/Dialogue"
import { isEmpty } from "../../lib/util"

@Classes.register()
export class SaveButtons extends Component {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    this.assembly = props.assembly
    return (
      <flow
        styleMod={{
          horizontally_stretchable: true,
          padding: 5,
        }}
      >
        <button caption={[L_Gui.Save]} on_gui_click={reg(this.onSaveClicked)} />
      </flow>
    )
  }

  @bound
  private onSaveClicked(e: OnGuiClickEvent) {
    const player = game.players[e.player_index]
    const content = this.assembly.getContent()
    if (!content) return
    if (content.lastPasteConflicts.get().some((x) => !isEmpty(x))) {
      this.warnAboutPasteConflicts(player)
    } else {
      this.beginSave(player)
    }
  }

  private warnAboutPasteConflicts(player: LuaPlayer) {
    showDialogue(player, {
      title: ["gui.confirmation"],
      content: <label caption={[L_Gui.ConfirmSaveWithPasteConflicts]} />,
      backCaption: ["gui.back"],
      confirmCaption: ["gui.save"],
      redConfirm: true,
      onConfirm: this.beginSave,
    })
  }

  @bound
  private beginSave(player: LuaPlayer) {
    const content = this.assembly.getContent()
    if (!content) return
    const changes = content.prepareSave()
    const hasDeletions = changes.deletions

    if (hasDeletions) {
      this.warnAboutDeletions(player)
    } else {
      this.commitSave(player)
    }
  }

  @bound
  private commitSave(player: LuaPlayer) {
    const content = this.assembly.getContent()
    if (!content) return
    const result = content.commitSave()
    if (result) {
      player.print([L_Interaction.AssemblySaved, result.content.asArray().length])
    }
  }

  private warnAboutDeletions(player: LuaPlayer) {
    showDialogue(player, {
      title: ["gui.confirmation"],
      content: <label caption={[L_Gui.ConfirmSaveWithDeletions]} />,
      backCaption: ["gui.back"],
      confirmCaption: ["gui.save"],
      redConfirm: true,
      onConfirm: this.commitSave,
    })
  }
}
