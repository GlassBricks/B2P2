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
  return itemStack.get_blueprint_entities() ?? []
}

export function pasteBlueprint({
  position,
  entities,
  surface = 1,
  force = "player",
  forceBuild = false,
}: {
  position: MapPosition
  entities: BlueprintEntity[]
  surface?: SurfaceIdentification
  forceBuild?: boolean
  force?: ForceIdentification
}): LuaEntity[] {
  const itemStack = getBPItemStack()
  itemStack.set_blueprint_entities(entities)
  itemStack.blueprint_snap_to_grid = [1, 1]
  itemStack.blueprint_absolute_snapping = true
  return itemStack.build_blueprint({
    surface,
    position,
    force,
    force_build: forceBuild,
    skip_fog_of_war: false,
  })
}

export function tryPasteBlueprint({
  position,
  entities,
  surface,
  force,
}: {
  position: MapPosition
  entities: BlueprintEntity[]
  surface?: SurfaceIdentification
  force?: ForceIdentification
}): {
  entities: LuaEntity[]
  neededForceBuild: boolean
} {
  const result = pasteBlueprint({
    position,
    entities,
    surface,
    force,
  })
  if (result.length !== 0) {
    return {
      entities: result,
      neededForceBuild: false,
    }
  }
  const result2 = pasteBlueprint({
    position,
    entities,
    surface,
    force,
    forceBuild: true,
  })
  return {
    entities: result2,
    neededForceBuild: result2.length !== 0,
  }
}

export function clearArea(area: BoundingBox, surface: SurfaceIdentification = 1): void {
  surface = typeof surface === "object" ? surface : game.get_surface(surface) ?? error(`Surface ${surface} not found`)
  surface.find_entities(area).forEach((entity) => entity.destroy())
}