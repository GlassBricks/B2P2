import { Prototypes } from "../constants"
import { Events, Functions, protectedAction } from "../lib"
import { Assembly } from "./Assembly"

export function tryClearCursor(player: LuaPlayer): player is LuaPlayer & { cursor_stack: LuaItemStack } {
  return player.clear_cursor() && player.cursor_stack !== undefined
}

export function startAssemblyCreation(player: LuaPlayer): boolean {
  if (!tryClearCursor(player)) return false
  player.cursor_stack.set_stack({ name: Prototypes.AssemblyCreationTool })
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

export function startAssemblyCreationFromEvent(event: OnGuiClickEvent): void {
  const player = game.players[event.player_index]
  if (player) startAssemblyCreation(player)
}
Functions.registerAll({ startAssemblyCreationFromEvent })
