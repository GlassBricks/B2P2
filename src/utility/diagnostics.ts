import { L_Diagnostic } from "../locale"

export type Diagnostic = {
  severity: "error" | "warning" | "info"
  message: [L_Diagnostic, ...LocalisedString[]]
}

export interface ResultWithDiagnostics<T> {
  result: T
  diagnostics: Diagnostic[]
}
