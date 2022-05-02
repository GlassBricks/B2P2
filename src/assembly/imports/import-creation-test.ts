import { Assembly } from "../Assembly"
import { getPlayer } from "../../lib/test-util/misc"
import { bbox } from "../../lib/geometry/bounding-box"
import { pos } from "../../lib/geometry/position"
import { startBasicImportCreation } from "./import-creation"
import { getBlueprintSample } from "../../test/blueprint-sample"
import { pasteBlueprint } from "../../world-interaction/blueprint"
import { UP } from "../../lib/geometry/rotation"
import direction = defines.direction

const deleteAssemblies = () => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
}
before_all(deleteAssemblies)
after_all(deleteAssemblies)

test("create", () => {
  const surface = game.surfaces[1]
  const area = bbox.fromCorners(0, 0, 10, 10)
  const area2 = bbox.shift(area, pos(10, 0))

  const blueprint = getBlueprintSample("original")
  pasteBlueprint(surface, area2.left_top, blueprint)

  const target = Assembly.create("target", surface, area)
  const source = Assembly.create("source", surface, area2)

  const targetCenter = bbox.center(target.area)
  const outsideArea = pos.add(target.area.right_bottom, pos(10, 10))

  function importCreated(): boolean {
    return target.getContent()!.imports.length() > 0
  }

  const player = getPlayer()
  assert.true(startBasicImportCreation(player, target, source), "can start")
  assert.true(player.is_cursor_blueprint(), "has blueprint")

  player.build_from_cursor({
    position: targetCenter,
    direction: direction.east,
  })
  assert.false(importCreated(), "cannot rotate")
  assert.true(player.is_cursor_blueprint(), "still has blueprint")

  assert.true(startBasicImportCreation(player, target, source), "can start")
  player.build_from_cursor({
    position: outsideArea, // outside
  })
  assert.false(importCreated(), "cannot place outside")
  assert.true(player.is_cursor_blueprint(), "still has blueprint")
  assert.same([], surface.find_entities(bbox.around(outsideArea, 5)))

  assert.true(startBasicImportCreation(player, target, source), "can start")
  player.build_from_cursor({ position: targetCenter, direction: UP })

  assert.true(importCreated(), "can create")
  assert.true(player.is_cursor_empty(), "cursor stack is empty")
})

/*
commands.add_command("manual", "", () => {
  const surface = game.surfaces[1]
  const area = bbox.fromCorners(0, 0, 10, 10)
  const area2 = bbox.shift(area, pos(10, 0))

  const blueprint = getBlueprintSample("original")
  pasteBlueprint(surface, area2.left_top, blueprint)
  try {
    Assembly.create("target", surface, area)
    Assembly.create("source", surface, area2)
  } catch {
    game.print("error")
  }
  const source = Object.keys(Assembly.getAllAssemblies().value()).find(
    (x) => (x as unknown as Assembly).name.get() === "source",
  ) as unknown as Assembly
  const target = Object.keys(Assembly.getAllAssemblies().value()).find(
    (x) => (x as unknown as Assembly).name.get() === "target",
  ) as unknown as Assembly

  const player = getPlayer()
  startBasicImportCreation(player, target, source)
})
*/
