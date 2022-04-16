import { DiagnosticFactory } from "./Diagnostic"
import { L_Diagnostic } from "../locale"

describe("DiagnosticFactory", () => {
  test("basic usage", () => {
    const factory = DiagnosticFactory(L_Diagnostic.Overlap, "warning", (foo: number) => ({
      message: [L_Diagnostic.Overlap, foo],
    }))
    const result = factory(1)
    assert.same(
      {
        message: [L_Diagnostic.Overlap, 1],
        severity: "warning",
        location: undefined,
      },
      result,
    )
  })
  test("empty object", () => {
    const factory = DiagnosticFactory(L_Diagnostic.Overlap, "warning", () => ({}))
    const result = factory()
    assert.same(
      {
        message: [L_Diagnostic.Overlap],
        severity: "warning",
        location: undefined,
      },
      result,
    )
  })
})
