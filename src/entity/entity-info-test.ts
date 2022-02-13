import { bbox } from "../lib/geometry/bounding-box"
import { getTileBox } from "./entity-info"
import { getBlueprintEntities } from "../test-util/blueprint"
import { getArea } from "../test-util/area"

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
      const [surface, area] = getArea(1, name)
      const entities = getBlueprintEntities(area, surface)
      assert.equal(entities.length, 1)
      const entity = entities[0]
      assert.same(expected, getTileBox(entity).shiftToOrigin())
    },
  )
})
