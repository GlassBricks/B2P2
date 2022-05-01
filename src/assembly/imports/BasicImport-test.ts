import { Assembly } from "../Assembly"
import { BasicImport } from "./BasicImport"
import { getBlueprintSample } from "../../test/blueprint-sample"
import { get_area } from "__testorio__/testUtil/areas"
import { pasteBlueprint } from "../../world-interaction/blueprint"
import { bbox } from "../../lib/geometry/bounding-box"
import { assertBlueprintsEquivalent } from "../../test/blueprint"
import { Blueprint } from "../../blueprint/Blueprint"

test("BasicImport", () => {
  const blueprint = getBlueprintSample("original")
  const [surface, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  const area = bbox.normalize(area1)
  pasteBlueprint(surface, area.left_top, blueprint)
  const assembly = Assembly.create("test", surface, area)
  const im = new BasicImport(assembly)
  assert.same("test", im.getName().get())
  const content = im.getContent().get()!
  assertBlueprintsEquivalent(Blueprint.fromArray(blueprint), content)
})
