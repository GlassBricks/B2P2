import { getPlayer } from "../lib/test-util/misc"
import { startAssemblyCreation } from "./creation"
import { bbox } from "../lib/geometry/bounding-box"
import { Assembly } from "./Assembly"

const deleteAssemblies = () => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
}
before_all(deleteAssemblies)
after_all(deleteAssemblies)

test("create", () => {
  assert.true(Assembly.getAllAssemblies().size() === 0)

  const player = getPlayer()
  assert.true(startAssemblyCreation(player))

  script.get_event_handler(defines.events.on_player_selected_area)!({
    name: defines.events.on_player_selected_area,
    player_index: player.index,
    area: bbox.fromCorners(0, 0, 1, 1),
    entities: [],
    tiles: [],
    item: player.cursor_stack!.name,
    surface: player.surface,
    tick: game.tick,
  })

  const assembly = Assembly.getAllAssemblies().value().first()!
  assert.not_nil(assembly, "assembly created")
  assert.equal("Unnamed", assembly.name.get())
  assert.equal(player.surface, assembly.surface)
  assert.same(bbox.fromCorners(0, 0, 1, 1), assembly.area)
})
