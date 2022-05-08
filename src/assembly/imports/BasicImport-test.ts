import { Assembly } from "../Assembly"
import { BasicImport } from "./BasicImport"
import { getBlueprintSample } from "../../test/blueprint-sample"
import { clearBuildableEntities, pasteBlueprint } from "../../world-interaction/blueprint"
import { bbox } from "../../lib/geometry/bounding-box"
import { assertBlueprintsEquivalent } from "../../test/blueprint"
import { Blueprint } from "../../blueprint/Blueprint"
import { pos } from "../../lib/geometry/position"
import { isUserError } from "../../lib"
import { getWorkingArea1 } from "../../test/misc"

let blueprint: Blueprint
let surface: LuaSurface
let area: BoundingBoxRead
before_each(() => {
  blueprint = Blueprint.fromArray(getBlueprintSample("original"))
  ;[surface, area] = getWorkingArea1()
  clearBuildableEntities(surface, area)
})
after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

test("creation", () => {
  pasteBlueprint(surface, area.left_top, blueprint.asArray())
  const assembly = Assembly.create("test", surface, area)

  const im = BasicImport._createUnchecked(assembly, pos(0, 0))
  assert.same("test", im.name().get())
  const content = im.content().get()!
  assertBlueprintsEquivalent(blueprint, content)
  assert.same(pos(0, 0), im.getRelativePosition())
})

test("create for", () => {
  const area1 = bbox(area.left_top, pos.add(area.left_top, pos(10, 10)))
  const area2 = bbox.shift(area1, pos(20, 20))

  const assembly1 = Assembly.create("test1", surface, area1)
  const assembly2 = Assembly.create("test2", surface, area2)

  const err = assert.error(() => BasicImport.createFor(assembly2, assembly1, pos(10, 10))) //  no overlap
  assert.true(isUserError(err))

  const value = assert.no_error(() => BasicImport.createFor(assembly2, assembly1, pos(5, 5)))
  assert.true(value instanceof BasicImport)
  assert.same("test2", (value as BasicImport).name().get())
})
