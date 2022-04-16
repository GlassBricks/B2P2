import { L_Diagnostic } from "../locale"
import { Mutable } from "../lib/util-types"

export type DiagnosticSeverity = "error" | "warning"

export interface Diagnostic<D extends L_Diagnostic> {
  // also used as category
  readonly message: [category: D, ...args: LocalisedString[]]
  readonly severity: DiagnosticSeverity
  readonly location?: MapPositionTable
}

export function DiagnosticFactory<D extends L_Diagnostic, A extends any[]>(
  category: D,
  severity: DiagnosticSeverity,
  factory: (...args: A) => Partial<Diagnostic<D>>,
): (...args: A) => Diagnostic<D> {
  return (...args) => {
    const result = factory(...args) as Mutable<Diagnostic<D>>
    result.severity = severity
    result.message ??= [category]

    return result as Diagnostic<D>
  }
}
