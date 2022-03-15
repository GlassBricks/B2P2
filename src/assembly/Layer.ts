import { BlueprintPaste } from "../entity/Blueprint"
import { createDiagnosticFactory } from "../utility/diagnostic"
import { L_Diagnostic } from "../locale"

export interface Layer {
  name: string
  /** Returns undefined if this is not valid. */
  getContent(): BlueprintPaste | undefined
  // isValid(): boolean
  // dispose(): void
}

export const invalidLayer = createDiagnosticFactory(L_Diagnostic.InvalidLayer, (layer: Layer) => ({
  severity: "error",
  message: [L_Diagnostic.InvalidLayer, layer.name],
}))
