import { Assembly } from "../../assembly/Assembly"
import { GuiConstants } from "../../constants"
import { bound, Classes, reg } from "../../lib"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { L_Gui, L_Interaction } from "../../locale"
import { showDialogue } from "../window/Dialog"

@Classes.register()
export class SaveButton extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    this.assembly = props.assembly
    return (
      <button
        caption={[L_Gui.Save]}
        tooltip={[L_Gui.SaveButtonTooltip]}
        on_gui_click={reg(this.onSaveClicked)}
        styleMod={{
          width: GuiConstants.SaveResetButtonWidth,
          height: GuiConstants.SaveResetButtonHeight,
        }}
      />
    )
  }

  @bound
  private onSaveClicked(e: OnGuiClickEvent) {
    const player = game.players[e.player_index]
    const content = this.assembly.getContent()
    if (!content) return
    if (content.hasConflicts.get()) {
      this.warnAboutPasteConflicts(player)
    } else {
      this.beginSave(player)
    }
  }

  private warnAboutPasteConflicts(player: LuaPlayer) {
    showDialogue(player, {
      title: ["gui.confirmation"],
      message: [L_Gui.ConfirmSaveWithPasteConflicts],
      backCaption: ["gui.cancel"],
      confirmCaption: ["gui.save"],
      redConfirm: true,
      onConfirm: reg(this.beginSave),
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
    const result = content.commitAndReset()
    if (result) {
      player.print([L_Interaction.AssemblySaved, result.content.getEntities().length])
    }
    if (content.hasConflicts.get()) {
      player.print([L_Interaction.FoundPasteConflicts])
    }
  }

  private warnAboutDeletions(player: LuaPlayer) {
    showDialogue(player, {
      title: ["gui.confirmation"],
      message: [L_Gui.ConfirmSaveWithDeletions],
      backCaption: ["gui.cancel"],
      confirmCaption: ["gui.save"],
      redConfirm: true,
      onConfirm: reg(this.commitSave),
    })
  }
}

@Classes.register()
export class ResetButton extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    this.assembly = props.assembly
    return (
      <button
        style="red_button"
        caption={[L_Gui.Reset]}
        tooltip={[L_Gui.ResetButtonTooltip]}
        on_gui_click={reg(this.onResetClicked)}
        styleMod={{
          width: GuiConstants.SaveResetButtonWidth,
          height: GuiConstants.SaveResetButtonHeight,
        }}
      />
    )
  }

  @bound
  private onResetClicked(e: OnGuiClickEvent) {
    const player = game.players[e.player_index]
    const content = this.assembly.getContent()
    if (!content) return
    if (!e.shift) {
      showDialogue(player, {
        title: ["gui.confirmation"],
        message: [L_Gui.ConfirmResetAssembly],
        backCaption: ["gui.cancel"],
        confirmCaption: [L_Gui.Reset],
        redConfirm: true,
        onConfirm: reg(this.resetAssembly),
      })
    } else {
      // skip confirmation
      this.resetAssembly()
    }
  }

  @bound
  private resetAssembly() {
    const content = this.assembly.getContent()
    if (!content) return
    content.resetInWorld()
  }
}
