import { Prototypes } from "../constants"
import { Events, protectedAction } from "../lib"
import { L_Interaction } from "../locale"
import { Assembly } from "./Assembly"

export function tryClearCursor(player: LuaPlayer): player is LuaPlayer & { cursor_stack: LuaItemStack } {
  return player.clear_cursor() && player.cursor_stack !== undefined
}

export function startAssemblyCreation(player: LuaPlayer): boolean {
  if (!tryClearCursor(player)) return false
  player.cursor_stack.set_stack({ name: Prototypes.AssemblyCreationTool })
  player.create_local_flying_text({ text: [L_Interaction.SelectAreaForAssembly], create_at_cursor: true })
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
