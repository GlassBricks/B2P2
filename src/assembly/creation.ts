import { Prototypes } from "../constants"
import { Events } from "../lib"
import { L_Interaction } from "../locale"
import { protectedAction } from "../player-interaction/protected-action"
import { Assembly } from "./Assembly"

export function startAssemblyCreation(player: LuaPlayer): boolean {
  if (!player.clear_cursor() || !player.cursor_stack) {
    player.print([L_Interaction.CannotClearCursor])
    return false
  }
  player.cursor_stack.set_stack({ name: Prototypes.SingleSelectionTool })
  player.print([L_Interaction.SelectAreaForAssembly])
  return true
}
Events.on_player_selected_area((event) => {
  if (event.item !== Prototypes.SingleSelectionTool) return
  const player = game.players[event.player_index]
  const assembly = protectedAction(player, () => Assembly.create("Unnamed", event.surface, event.area))
  if (assembly) {
    player.print([L_Interaction.AssemblyCreated])
    player.clear_cursor()
  }
})
