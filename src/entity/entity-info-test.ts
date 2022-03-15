import { bbox } from "../lib/geometry/bounding-box"
import { getTileBox } from "./entity-info"
import { takeBlueprint } from "../world/blueprint"
import { getScriptArea } from "../utility/test-util"

describe.skip("bounding box", () => {
  test.each(
    [
      ["chest", bbox.fromCorners(0, 0, 1, 1)],
      ["furnace", bbox.fromCorners(0, 0, 2, 2)],
      ["assembling machine", bbox.fromCorners(0, 0, 3, 3)],
      ["splitter", bbox.fromCorners(0, 0, 1, 2)],
      ["offshore pump", bbox.fromCorners(0, 0, 2, 1)],
    ],
    "Size of bounding box for %s is correct",
    (name, expected) => {
      const [surface, area] = getScriptArea(1 as SurfaceIndex, name)
      const entities = takeBlueprint(surface, area)
      assert.equal(1, entities.length)
      const entity = entities[0]
      assert.same(expected, getTileBox(entity).shiftToOrigin())
    },
  )
})
