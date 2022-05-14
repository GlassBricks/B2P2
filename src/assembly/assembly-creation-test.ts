import { Prototypes } from "../constants"
import { bbox } from "../lib/geometry"
import { getPlayer } from "../lib/test-util/misc"
import { Assembly } from "./Assembly"
import { startAssemblyCreation } from "./assembly-creation"

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

  const area = bbox.fromCoords(0, 0, 2, 2)
  script.get_event_handler(defines.events.on_player_selected_area)!({
    name: defines.events.on_player_selected_area,
    player_index: player.index,
    area,
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
  assert.same(area, assembly.area)
})
