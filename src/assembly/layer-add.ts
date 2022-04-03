import { MutableBasicBlueprint } from "../entity/Blueprint"
import { Layer } from "./Layer"
import { asBasicEntity, findCompatibleOrOverlappingEntity, applyEntityUpdate } from "../entity/entity-diff"
import { Diagnostic } from "../utility/diagnostic"
import {
  addEntityOverAddEntity,
  invalidLayer,
  overlap,
  unpasteableEntity,
  updateEntityLostReference,
} from "./diagnostics"

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
      const { entity: pasteResult, incompatibleProps } = applyEntityUpdate(existing.entity, entity)
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
