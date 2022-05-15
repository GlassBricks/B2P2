import { bbox, pos } from "../lib/geometry"
import { getPlayer } from "../lib/test-util/misc"
import { Assembly } from "./Assembly"
import { assemblyAtPlayerLocation, getAssemblyAtPosition } from "./player-tracking"

after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

test("getAssemblyAtPosition", () => {
  const area = bbox.fromCoords(-2, -2, 2, 2)
  const surface = game.surfaces[1]
  const assembly = Assembly.create("test", surface, area)

  for (const [x, y] of area.expand(1).iterateTiles()) {
    const pos1 = pos(x + 0.5, y + 0.5)
    const assemblyAtPosition = getAssemblyAtPosition(1 as SurfaceIndex, pos1)
    if (area.contains(pos1)) {
      assert.not_nil(assemblyAtPosition)
      assert.equal(assembly, assemblyAtPosition)
    } else {
      assert.is_nil(assemblyAtPosition)
    }
  }
})

test("getAssemblyAtPlayerLocation", () => {
  // same thing, put teleport player around
  const area = bbox.fromCoords(-2, -2, 2, 2)
  const surface = game.surfaces[1]
  const assembly = Assembly.create("test", surface, area)

  const player = getPlayer()
  if (player.controller_type !== defines.controllers.editor) {
    player.toggle_map_editor()
  }

  const state = assemblyAtPlayerLocation(player.index)
  for (const [x, y] of area.expand(1).iterateTiles()) {
    const pos1 = pos(x + 0.5, y + 0.5)
    player.teleport(pos1, surface)
    const assemblyAtPosition = state.get()
    if (area.contains(pos1)) {
      assert.not_nil(assemblyAtPosition)
      assert.equal(assembly, assemblyAtPosition)
    } else {
      assert.is_nil(assemblyAtPosition)
    }
  }

  // sets to undefined when editor mode disabled
  player.teleport(pos(0, 0), surface)
  assert.not_nil(state.get())
  player.toggle_map_editor()
  assert.is_nil(state.get())
})
