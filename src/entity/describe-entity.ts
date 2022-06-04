import { L_B2p2 } from "../locale"

export function describeEntity(entityName: string): LocalisedString {
  return ["", [L_B2p2.EntityPicture, entityName], ["entity-name." + entityName]]
}

export function describeItems(items: Record<string, number> | undefined): LocalisedString {
  if (!items) return [L_B2p2.NoItems]
  const result: LocalisedString & LocalisedString[] = [""]
  for (const [item, count] of pairs(items)) {
    result.push([L_B2p2.ItemCountPicture, count, item])
  }
  return result
}
