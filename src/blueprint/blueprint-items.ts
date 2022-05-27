import { Migrations } from "../lib/migration"

declare const global: {
  blueprintInventory: LuaInventory
}

Migrations.from("0.3.0", () => {
  // remove old inventory, if any
  interface OldGlobal {
    __tempBlueprintInventory?: LuaInventory
  }
  const oldGlobal = global as unknown as OldGlobal
  const tempBlueprintInventory = oldGlobal.__tempBlueprintInventory
  if (tempBlueprintInventory) {
    tempBlueprintInventory.destroy()
    oldGlobal.__tempBlueprintInventory = undefined
  }

  const modName = script.mod_name
  for (const inv of game.get_script_inventories(modName)[modName]) {
    inv.destroy()
  }
})

Migrations.since("0.3.0", () => {
  const inv = (global.blueprintInventory = game.create_inventory(16))
  inv[0].set_stack("blueprint")
})

export function prepareBlueprintStack(stack: BlueprintItemStack): void {
  stack.set_stack("blueprint")
  stack.blueprint_snap_to_grid = [2, 2]
  stack.blueprint_absolute_snapping = true
}
export function getTempBpItemStack(): BlueprintItemStack {
  const stack = global.blueprintInventory[0]
  prepareBlueprintStack(stack)
  return stack
}

export function allocateBPItemStack(): BlueprintItemStack {
  const inv = global.blueprintInventory
  const [stack] = inv.find_empty_stack()
  if (stack) {
    prepareBlueprintStack(stack)
    return stack
  }
  // not enough room, increase size
  inv.resize(inv.length * 2)
  return allocateBPItemStack()
}

export function freeBPItemStack(stack: BlueprintItemStack): void {
  stack.clear()
}
