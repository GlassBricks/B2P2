import { bbox } from "../utility/bounding-box"
import { test_area } from "__testorio__/testUtil/areas"
import { getTileArea } from "./entity-info"
import { getBlueprintEntities } from "../test-util/blueprint"

describe("bounding box", () => {
  test.each(
    [
      ["chest", bbox.corners(0, 0, 1, 1)],
      ["furnace", bbox.corners(0, 0, 2, 2)],
      ["assembling machine", bbox.corners(0, 0, 3, 3)],
      ["splitter", bbox.corners(0, 0, 1, 2)],
      ["offshore pump", bbox.corners(0, 0, 2, 1)],
    ],
    "Size of bounding box for %s is correct",
    (name, expected) => {
      const [surface, area] = test_area(1, name)
      const entities = getBlueprintEntities(surface, area)
      assert.equal(entities.length, 1)
      const entity = entities[0]
      assert.same(expected, getTileArea(entity).shiftToOrigin())
    },
  )
})
