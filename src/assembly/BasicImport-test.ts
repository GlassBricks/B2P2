import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { Blueprint, getBlueprintFromWorld, MutableBlueprint } from "../blueprint/Blueprint"
import { get_area } from "__testorio__/testUtil/areas"
import { getBlueprintSample } from "../test/blueprint-sample"
import { Assembly } from "./Assembly"
import { pasteBlueprint } from "../world-interaction/blueprint"
import { BasicImport } from "./BasicImport"
import { pos } from "../lib/geometry/position"
import { assertBlueprintsEquivalent } from "../test/blueprint"

let area1: BoundingBoxClass
let area2: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: Blueprint

before_all(() => {
  let [, area] = get_area(1 as SurfaceIdentification, "working area 1")
  area1 = bbox.normalize(area)
  ;[surface, area] = get_area(1 as SurfaceIdentification, "working area 2")
  area2 = bbox.normalize(area)

  originalBlueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("original"))
})
after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

test("BasicImport imports contents of another", () => {
  pasteBlueprint(surface, area1.left_top, originalBlueprintSample.getAsArray())
  const sourceAssembly = Assembly.create("test", surface, area1)
  const targetAssembly = Assembly.create("test2", surface, area2)
  const basicImport = new BasicImport(sourceAssembly)
  targetAssembly.addImport(basicImport, pos(0, 0))
  targetAssembly.refreshInWorld()
  const results = getBlueprintFromWorld(surface, area2)
  assertBlueprintsEquivalent(originalBlueprintSample, results)
})

declare const global: {
  foo?: unknown
}
test("BasicImport persists across game reload", () => {
  const sourceAssembly = Assembly.create("test", surface, area1)
  global.foo = new BasicImport(sourceAssembly)
}).after_mod_reload(() => {
  assert.is_true(global.foo instanceof BasicImport)
})
after_all(() => {
  delete global.foo
})
