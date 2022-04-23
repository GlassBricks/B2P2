import { Events } from "./lib"
import "./assembly"
import "./gui"

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
      Events.raiseFakeEventNamed("on_init", undefined)
      const force = game.forces.player
      force.enable_all_recipes()
    },
    after_test_run() {
      game.players[1]?.gui.screen["testorio:test-config"]?.bring_to_front()
    },
    log_passed_tests: false,
  } as Testorio.Config)
}
