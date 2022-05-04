import { L_Diagnostic } from "../../locale"
import { addDiagnostic, DiagnosticCategory, DiagnosticCollection } from "./Diagnostic"

const category = DiagnosticCategory("overlap", L_Diagnostic.Overlap, undefined, (value) => ({
  message: [L_Diagnostic.Overlap, value],
}))
test("DiagnosticFactory", () => {
  const result = category.create(1)
  assert.same(
    {
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
      [category.id]: {
        category,
        diagnostics: [{ message: [L_Diagnostic.Overlap, 1] }],
      },
    },
    map,
  )
})
