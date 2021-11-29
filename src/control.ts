import "./lib"

if (script.active_mods.testorio) {
  require("__testorio__/init")(["lib/events-test", "lib/references-test", "lib/value-test"], {
    default_ticks_between_tests: 1,
  })
}
