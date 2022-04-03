import { L_Diagnostic } from "../locale"

export type Severity = "error" | "warning"

export interface Diagnostic {
  id: L_Diagnostic
  severity: Severity
  message: LocalisedString
  position?: MapPositionTable
  additionalInfo?: LocalisedString[]
}
export interface PartialDiagnostic extends Partial<Diagnostic> {
  message: LocalisedString
}

export function createDiagnosticFactory<A extends any[]>(
  id: L_Diagnostic,
  func: (...args: any) => PartialDiagnostic,
): (...args: A) => Diagnostic {
  return function (...args: A): Diagnostic {
    return {
      id,
      severity: "warning",
      ...func(...args),
    }
  }
}

export function createInternalErrorMessage(message: LocalisedString): LocalisedString {
  return [L_Diagnostic.InternalError, message]
}
