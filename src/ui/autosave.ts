import { Assembly } from "../assembly/Assembly"
import { assemblyAtPlayerLocation } from "../assembly/player-tracking"
import { Settings } from "../constants"
import { bind, Functions, onPlayerInit } from "../lib"
import { L_Interaction } from "../locale"

function attemptAutosave(this: unknown, player: LuaPlayer, _: unknown, oldAssembly: Assembly | undefined) {
  if (!oldAssembly || !oldAssembly.isValid()) return
  if (!player.mod_settings[Settings.Autosave].value) return
  const content = oldAssembly.getContent()
  if (!content) return

  if (content.hasConflicts.get()) {
    player.print([L_Interaction.AutosaveFailedHasConflicts, oldAssembly.displayName.get()])
    return
  }
  const diff = content.prepareSave()
  if (diff.deletions) {
    player.print([L_Interaction.AutosaveFailedHasDeletions, oldAssembly.displayName.get()])
    return
  }
  content.commitAndReset()
  player.print([L_Interaction.AutosaveSucceeded, oldAssembly.displayName.get()])
}
Functions.registerAll({ attemptAutosave })

onPlayerInit((player) => {
  assemblyAtPlayerLocation(player.index)!.subscribe(bind(attemptAutosave, undefined, player))
})
