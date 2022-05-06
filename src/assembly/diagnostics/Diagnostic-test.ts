import { L_Diagnostic } from "../../locale"
import {
  addDiagnostic,
  createDiagnosticHighlight,
  Diagnostic,
  DiagnosticCategory,
  DiagnosticCollection,
  getActualLocation,
  Location,
} from "./Diagnostic"
import { pos } from "../../lib/geometry/position"
import { bbox } from "../../lib/geometry/bounding-box"

const category = DiagnosticCategory(
  {
    id: "test diagnostic",
    shortDescription: [L_Diagnostic.Overlap],
  },
  (value) => ({
    message: [L_Diagnostic.Overlap, value],
  }),
)
test("DiagnosticFactory", () => {
  const result = category.create(1)
  assert.same(
    {
      id: category.id,
      message: [L_Diagnostic.Overlap, 1],
    },
    result,
  )
})

test("addDiagnostic", () => {
  const map: DiagnosticCollection = {}
  addDiagnostic(map, category, 1)
  assert.same(
    {
      [category.id]: [
        {
          id: category.id,
          message: [L_Diagnostic.Overlap, 1],
        },
      ],
    },
    map,
  )
})

describe("highlight", () => {
  test("undefined for no entity", () => {
    const diagnostic = category.create(1)
    const result = createDiagnosticHighlight(diagnostic)
    assert.is_nil(result)
  })

  test("getActualLocation", () => {
    const location: Location = {
      surface: game.surfaces[1],
      worldTopLeft: pos(1, 1),
      boundingBox: bbox.fromCorners(0, 0, 1, 1),
    }
    const actualLocation = getActualLocation(location)
    assert.same(bbox.fromCorners(1, 1, 2, 2), actualLocation)
  })

  test("with location", () => {
    const diagnostic: Diagnostic = {
      id: category.id,
      message: [L_Diagnostic.Overlap, 1],
      location: {
        surface: game.surfaces[1],
        worldTopLeft: pos(0, 0),
        boundingBox: bbox.fromCorners(0, 0, 1, 1),
      },
    }
    const result = createDiagnosticHighlight(diagnostic)!
    assert.not_nil(result)
    assert.same(pos(0.5, 0.5), result.position)
    assert.same(bbox.fromCorners(0, 0, 1, 1), result.bounding_box)
    assert.equal("highlight-box", result.name)
  })
})
