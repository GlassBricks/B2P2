import { MutableBasicBlueprint } from "../entity/Blueprint"
import { invalidLayer, Layer } from "./Layer"
import { asBasicEntity, findCompatibleOrOverlappingEntity, pasteEntityUpdate } from "../entity/entity-diff"
import { createDiagnosticFactory, Diagnostic } from "../utility/diagnostic"
import { L_Diagnostic } from "../locale"
import { BaseEntity, describeEntity, UpdateableEntityProp } from "../entity/Entity"

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
  (entity: BaseEntity, incompatibleProps: readonly UpdateableEntityProp[]) => ({
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

export function layerAdd(state: MutableBasicBlueprint, layer: Layer): Diagnostic[] {
  const content = layer.getContent()
  if (!content) {
    return [invalidLayer(layer)]
  }
  const diagnostics: Diagnostic[] = []
  for (const [, entity] of pairs(content.entities)) {
    const existing = findCompatibleOrOverlappingEntity(state, entity)
    if (existing.type === "overlapping") {
      diagnostics.push(overlap(existing.entity, entity))
    }

    if (entity.diffType === undefined) {
      // addition
      if (existing.type !== "compatible") {
        state.add(entity)
        continue
      }
      // compatible with existing entity, warn add over add
      diagnostics.push(addEntityOverAddEntity(existing.entity, entity))
      // fall through to treating as update entity
    }

    // update
    if (existing.type === "compatible") {
      const { entity: pasteResult, incompatibleProps } = pasteEntityUpdate(existing.entity, entity)
      if (incompatibleProps.length > 0) {
        diagnostics.push(unpasteableEntity(entity, incompatibleProps))
      }
      state.replaceUnsafe(existing.entity, pasteResult)
    } else {
      // compatible not found
      diagnostics.push(updateEntityLostReference(entity))
      state.add(asBasicEntity(entity))
    }
  }
  return diagnostics
}
