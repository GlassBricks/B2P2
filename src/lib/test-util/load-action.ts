import { Events } from "../index"
import { getPlayer } from "./misc"

const loadActions: Record<string, (data: any, player: LuaPlayer) => void> = {}

export function PostLoadAction<T extends LocalisedString>(
  name: string,
  action: (data: T, player: LuaPlayer) => void,
): (data: T) => void {
  if (name in loadActions) {
    error(`Load action ${name} already exists`)
  }
  loadActions[name] = action
  return (data) => {
    game.reload_mods()
    // hack into request translation to run an action after reload

    const player = getPlayer()
    player.request_translation(["test-post-load-action", name, data])
  }
}

Events.on_string_translated((event) => {
  if (typeof event.localised_string !== "object") return
  const [key, name, data] = event.localised_string as [string, string, unknown]
  if (key !== "test-post-load-action") return
  const player = game.get_player(event.player_index)!
  if (!loadActions[name]) {
    player.print(`load action not found (possibly after reload): ${name}`)
    return
  }
  loadActions[name](data, player)
})
