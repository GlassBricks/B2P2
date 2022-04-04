declare const global: {
  __sharedInventory: LuaInventory
}

export function getTempItemStack(): LuaItemStack {
  const inventory = (global.__sharedInventory ??= game.create_inventory(1))
  return inventory[0]
}
