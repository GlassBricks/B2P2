import { bbox, pos } from "../lib/geometry"
import { highlightArea } from "./AreaIdentification"

describe("highlight", () => {
  test("undefined for no entity", () => {
    const result = highlightArea(undefined, "entity", {})
    assert.is_nil(result)
  })

  test("with location", () => {
    const result = highlightArea(
      {
        surface: game.surfaces[1],
        area: bbox.fromCoords(0, 0, 1, 1),
      },
      "entity",
    )!
    assert.not_nil(result)
    assert.same(pos(0.5, 0.5), result.position)
    assert.same(bbox.fromCoords(0, 0, 1, 1), result.bounding_box)
    assert.equal("highlight-box", result.name)
  })
})
