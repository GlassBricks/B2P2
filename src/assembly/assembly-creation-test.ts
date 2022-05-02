import { getPlayer } from "../lib/test-util/misc"
import { startAssemblyCreation } from "./assembly-creation"
import { bbox } from "../lib/geometry/bounding-box"
import { Assembly } from "./Assembly"
import { Prototypes } from "../constants"

const deleteAssemblies = () => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
}
before_all(deleteAssemblies)
after_all(deleteAssemblies)

test("create", () => {
  const player = getPlayer()
  assert.true(startAssemblyCreation(player))
  assert.equal(Prototypes.AssemblyCreationTool, player.cursor_stack?.name)

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

  assert.is_false(player.cursor_stack?.valid_for_read)

  const assembly = Assembly.getAllAssemblies().value().first()!
  assert.not_nil(assembly, "assembly created")
  assert.equal("", assembly.name.get())
  assert.equal(player.surface, assembly.surface)
  assert.same(bbox.fromCorners(0, 0, 1, 1), assembly.area)
})
