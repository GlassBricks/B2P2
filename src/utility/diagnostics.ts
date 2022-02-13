import { L_Diagnostic } from "../locale"

export type Diagnostic = {
  severity: "error" | "warning"
  message: [L_Diagnostic, ...LocalisedString[]]
}

export function createDiagnostic(
  severity: "error" | "warning",
  category: L_Diagnostic,
  ...args: LocalisedString[]
): Diagnostic {
  return {
    severity,
    message: [category, ...args],
  }
}

export interface ResultWithDiagnostics<T> {
  result: T
  diagnostics: Diagnostic[]
}
