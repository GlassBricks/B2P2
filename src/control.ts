import { Events } from "./lib"
import "./assembly"
import "./gui"
import { Assembly } from "./assembly/Assembly"
import { bbox } from "./lib/geometry/bounding-box"
import { openWindow } from "./gui/window/Window"

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
      const results = remote.call("testorio", "getResults")
      if (results.status === "passed" && results.skipped === 0) {
        Assembly.create("test", game.surfaces[1], bbox.fromCorners(0, 0, 20, 20))
        Assembly.create("test2", game.surfaces[1], bbox.fromCorners(20, 0, 40, 20))
        openWindow("assemblies-list", game.players[1])
      } else {
        game.players[1]?.gui.screen["testorio:test-config"]?.bring_to_front()
      }
    },
    log_passed_tests: false,
  } as Testorio.Config)
}
