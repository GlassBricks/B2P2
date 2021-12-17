import "./lib"

if (script.active_mods.testorio) {
  require("__testorio__/init")(
    [
      "lib/Events-test",
      "lib/registry-test",
      "lib/references-test",
      "lib/callbags/callbag-test",
      "lib/callbags/state-test.ts",
      "lib/player-data-test",
      "lib/factoriofx/Element-test",
    ],
    {
      tag_blacklist: ["after_mod_reload"],
    },
  )
}
