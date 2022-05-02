import { Prototypes } from "../constants"
import { Events } from "../lib"
import { L_Interaction } from "../locale"
import { protectedAction } from "../player-interaction/protected-action"
import { Assembly } from "./Assembly"

export function tryClearCursor(player: LuaPlayer): player is LuaPlayer & { cursor_stack: LuaItemStack } {
  if (!player.clear_cursor() || !player.cursor_stack) {
    player.print([L_Interaction.CannotClearCursor])
    return false
  }
  return true
}

export function startAssemblyCreation(player: LuaPlayer): boolean {
  if (!tryClearCursor(player)) return false
  player.cursor_stack.set_stack({ name: Prototypes.AssemblyCreationTool })
  player.print([L_Interaction.SelectAreaForAssembly])
  return true
}
Events.on_player_selected_area((event) => {
  if (event.item !== Prototypes.AssemblyCreationTool) return
  const player = game.players[event.player_index]
  const assembly = protectedAction(player, () => Assembly.create("", event.surface, event.area))
  if (assembly) {
    player.clear_cursor()
  }
})
