import { createDiagnosticFactory, createInternalErrorMessage } from "../utility/diagnostic"
import { L_Diagnostic } from "../locale"
import { BaseEntity, describeEntity, UpdateableProp } from "../entity/Entity"
import { Layer } from "./Layer"

export const invalidLayer = createDiagnosticFactory(L_Diagnostic.InvalidLayer, (layer: Layer) => ({
  severity: "error",
  message: [L_Diagnostic.InvalidLayer, layer.name],
}))
export const overlap = createDiagnosticFactory(L_Diagnostic.Overlap, (below: BaseEntity, above: BaseEntity) => ({
  message: [L_Diagnostic.Overlap, describeEntity(above), describeEntity(below)],
  position: above.position,
  severity: "error",
}))
export const addEntityOverAddEntity = createDiagnosticFactory(
  L_Diagnostic.AddEntityOverAddEntity,
  (below: BaseEntity, above: BaseEntity) => ({
    message: [L_Diagnostic.AddEntityOverAddEntity, describeEntity(above), describeEntity(below)],
    position: above.position,
    severity: "warning",
  }),
)
export const unpasteableEntity = createDiagnosticFactory(
  L_Diagnostic.UnpasteableEntity,
  (entity: BaseEntity, incompatibleProps: readonly UpdateableProp[]) => ({
    message: [L_Diagnostic.UnpasteableEntity, describeEntity(entity)],
    position: entity.position,
    severity: "error",
    additionalInfo: incompatibleProps.map((prop) => [L_Diagnostic.PropCannotBePasted, prop]),
  }),
)
export const updateEntityLostReference = createDiagnosticFactory(
  L_Diagnostic.UpdateEntityLostReference,
  (entity: BaseEntity) => ({
    message: [L_Diagnostic.UpdateEntityLostReference, describeEntity(entity)],
    position: entity.position,
    severity: "warning",
  }),
)
export const belowEntityDeleted = createDiagnosticFactory(L_Diagnostic.BelowEntityDeleted, (entity: BaseEntity) => ({
  message: [L_Diagnostic.BelowEntityDeleted, describeEntity(entity)],
  position: entity.position,
  severity: "warning",
}))

export const updateToNonexistentEntity = createDiagnosticFactory(
  L_Diagnostic.UpdateToNonexistentEntity,
  (entity: BaseEntity) => ({
    message: createInternalErrorMessage([L_Diagnostic.UpdateToNonexistentEntity, describeEntity(entity)]),
    position: entity.position,
    severity: "error",
  }),
)
