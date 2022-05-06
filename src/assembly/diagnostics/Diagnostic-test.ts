import { L_Diagnostic } from "../../locale"
import {
  addDiagnostic,
  createDiagnosticHighlight,
  Diagnostic,
  DiagnosticCategory,
  DiagnosticCollection,
} from "./Diagnostic"
import { pos } from "../../lib/geometry/position"
import { Entity } from "../../entity/entity"

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
    const result = createDiagnosticHighlight(diagnostic, game.surfaces[1], pos(0, 0))
    assert.is_nil(result)
  })

  test("with entity", () => {
    const mockEntity: Entity = {
      name: "iron-chest",
      position: pos(0, 0),
      entity_number: 1,
    }
    const diagnostic: Diagnostic = {
      id: category.id,
      message: [L_Diagnostic.Overlap, 1],
      entity: mockEntity,
      relativePosition: pos(0.5, 0.5),
    }
    const result = createDiagnosticHighlight(diagnostic, game.surfaces[1], pos(0, 0))!
    assert.not_nil(result)
    assert.same(pos(0.5, 0.5), result.position)
    assert.equal("highlight-box", result.name)
  })
})
