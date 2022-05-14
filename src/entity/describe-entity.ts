import { L_Bbpp } from "../locale"
import { Entity } from "./entity"

export function describeEntity(entity: Entity): LocalisedString {
  return ["", [L_Bbpp.EntityPicture, entity.name], ["entity-name." + entity.name]]
}

export function describeItems(items: Record<string, number> | undefined): LocalisedString {
  if (!items) return [L_Bbpp.NoItems]
  const result: LocalisedString & LocalisedString[] = [""]
  for (const [item, count] of pairs(items)) {
    result.push([L_Bbpp.ItemCountPicture, count, item])
  }
  return result
}
