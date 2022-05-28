import { L_Diagnostic } from "../../locale"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./Diagnostic"

const category = DiagnosticCategory(
  {
    id: "test diagnostic",
    title: [L_Diagnostic.Overlap],
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
