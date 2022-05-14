import { Assembly } from "../assembly/Assembly"
import { assemblyAtPlayerLocation } from "../assembly/player-tracking"
import { Settings } from "../constants"
import { bind, Functions, onPlayerInit, protectedAction } from "../lib"
import { L_Interaction } from "../locale"

function doAutosave(oldAssembly: Assembly | undefined, player: LuaPlayer) {
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
function attemptAutosave(this: unknown, player: LuaPlayer, _: unknown, oldAssembly: Assembly | undefined) {
  protectedAction(player, doAutosave, oldAssembly, player)
}
Functions.registerAll({ attemptAutosave })

onPlayerInit((player) => {
  assemblyAtPlayerLocation(player.index)!.subscribe(bind(attemptAutosave, undefined, player))
})
