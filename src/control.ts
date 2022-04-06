// import "./lib"
import { Events } from "./lib"

declare function __getTestFiles(): string[]

if (script.active_mods.testorio) {
  let testsStarted = false
  Events.on_game_created_from_scenario(() => {
    testsStarted = true
  })
  Events.on_player_created((p) => {
    if (!testsStarted) return
    game.get_player(p.player_index)?.toggle_map_editor()
    game.tick_paused = false
  })

  const tagBlacklist: string[] = []
  if (__DebugAdapter) {
    tagBlacklist.push("after_mod_reload")
  }

  require("__testorio__/init")(__getTestFiles(), {
    tag_blacklist: tagBlacklist,
    before_test_run() {
      const force = game.forces.player
      force.enable_all_recipes()
    },
  } as Testorio.Config)
}
