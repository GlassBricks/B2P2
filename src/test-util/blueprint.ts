let itemStack: BlueprintItemStack | undefined

export function getBlueprintEntities(
  surface: SurfaceIdentification,
  area: BoundingBox,
  force: ForceIdentification = "player",
): BlueprintEntityRead[] {
  if (itemStack === undefined) {
    itemStack = game.create_inventory(1)[0]
    itemStack.set_stack("blueprint")
  }
  itemStack.create_blueprint({
    surface,
    area,
    force,
  })
  itemStack.blueprint_snap_to_grid = [1, 1]
  return itemStack.get_blueprint_entities()
}
