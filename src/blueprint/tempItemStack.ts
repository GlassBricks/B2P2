import { Migrations } from "../lib/migration"
import { prepareBlueprintStack } from "./Blueprint"

declare const global: {
  __tempBlueprintInventory: LuaInventory
}

Migrations.since("0.3.0", () => {
  for (const inv of game.get_script_inventories(script.mod_name)[script.mod_name]) {
    log("foo")
    inv.destroy()
  }
  global.__tempBlueprintInventory = game.create_inventory(1)
})

export function getTempBpItemStack(): BlueprintItemStack {
  const stack = global.__tempBlueprintInventory[0]
  prepareBlueprintStack(stack)
  return stack
}
