import { bbox } from "../../lib/geometry/bounding-box"
import { pos } from "../../lib/geometry/position"
import { L_Diagnostic } from "../../locale"
import { addDiagnostic, createHighlight, DiagnosticCategory, DiagnosticCollection } from "./Diagnostic"

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
    const result = createHighlight(undefined, "entity", {})
    assert.is_nil(result)
  })

  test("with location", () => {
    const result = createHighlight(
      {
        surface: game.surfaces[1],
        area: bbox.fromCorners(0, 0, 1, 1),
      },
      "entity",
    )!
    assert.not_nil(result)
    assert.same(pos(0.5, 0.5), result.position)
    assert.same(bbox.fromCorners(0, 0, 1, 1), result.bounding_box)
    assert.equal("highlight-box", result.name)
  })
})
