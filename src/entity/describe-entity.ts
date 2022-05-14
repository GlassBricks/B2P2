import { L_B2p2 } from "../locale"
import { Entity } from "./entity"

export function describeEntity(entity: Entity): LocalisedString {
  return ["", [L_B2p2.EntityPicture, entity.name], ["entity-name." + entity.name]]
}

export function describeItems(items: Record<string, number> | undefined): LocalisedString {
  if (!items) return [L_B2p2.NoItems]
  const result: LocalisedString & LocalisedString[] = [""]
  for (const [item, count] of pairs(items)) {
    result.push([L_B2p2.ItemCountPicture, count, item])
  }
  return result
}
