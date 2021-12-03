import "./lib"

if (script.active_mods.testorio) {
  require("__testorio__/init")(
    ["lib/Events-test", "lib/registry-test", "lib/references-test", "lib/value-test", "lib/player-data-test"],
    {
      default_ticks_between_tests: 1,
    },
  )
}
