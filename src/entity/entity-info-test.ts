import { test_area } from "__testorio__/testUtil/areas"
import { getTileArea } from "./entity-info"
import { bbox } from "../lib/geometry/bounding-box"
import { takeBlueprint } from "../world-interaction/blueprint"

describe("bounding box", () => {
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
      const [surface, area] = test_area(1 as SurfaceIdentification, name)
      const entities = takeBlueprint(surface, area)
      assert.equal(entities.length, 1)
      const entity = entities[0]
      assert.same(expected, getTileArea(entity).shiftToOrigin())
    },
  )
})
