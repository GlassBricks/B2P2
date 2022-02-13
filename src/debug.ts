import { debugPrint } from "./utility/debug"

commands.add_command("analyze-blueprint", "", (d) => {
  if (!d.player_index) return
  const player = game.players[d.player_index]

  const blueprint = player.cursor_stack
  if (!blueprint || blueprint.name !== "blueprint") return

  const items = blueprint.get_blueprint_entities()
  debugPrint(items)
})
