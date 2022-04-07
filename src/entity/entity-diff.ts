import { pos } from "../lib/geometry/position"
import { getEntityInfo } from "./entity-info"

export function isCompatibleEntity(a: BlueprintEntityRead, b: BlueprintEntityRead): boolean {
  if (!pos.equals(a.position, b.position)) return false

  const aInfo = getEntityInfo(a.name)
  const bInfo = getEntityInfo(b.name)
  if (aInfo.entityGroup !== bInfo.entityGroup) return false

  return aInfo.isRotationPasteable || a.direction === b.direction
}
