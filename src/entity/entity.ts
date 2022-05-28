// noinspection JSUnusedGlobalSymbols

import { Mutable, mutableShallowCopy } from "../lib"

export type EntityNumber = number

/** Minimally enough information to identify an existing entity. */
export type Entity = Pick<BlueprintEntityRead, "name" | "position" | "direction">

export type FullEntity = BlueprintEntityRead

export interface PlainEntity extends FullEntity {
  changedProps?: never
  isPartialEntity?: never
  isErrorEntity?: never
}

export interface ReferenceEntity extends FullEntity {
  readonly changedProps: LuaSet<UpdateableProp>
  isPartialEntity?: never
  isErrorEntity?: never
}
export type UpdateableReferenceEntity = Mutable<ReferenceEntity>
export type PasteEntity = PlainEntity | ReferenceEntity
export type UpdateablePasteEntity = PlainEntity | UpdateableReferenceEntity

export interface PartialEntity extends Mutable<BlueprintEntityRead> {
  changedProps?: never
  isErrorEntity?: never
  isPartialEntity: true
}
export interface ErrorEntity extends Entity {
  changedProps?: never
  isErrorEntity: true
  isPartialEntity?: never
}

export type IntermediateEntity = PartialEntity | ErrorEntity

function remapEntityNumbers<T extends FullEntity>(
  entities: readonly T[],
  map: Record<EntityNumber, EntityNumber>,
): T[] {
  return entities.map((entity) => {
    const newEntity = mutableShallowCopy(entity)

    newEntity.entity_number = map[newEntity.entity_number]

    const neighbours = newEntity.neighbours
    if (neighbours) {
      newEntity.neighbours = neighbours.map((n) => map[n])
    }

    const connection = entity.connections
    if (connection !== undefined) {
      newEntity.connections = {
        "1": remapConnectionPoint(connection["1"]),
        "2": remapConnectionPoint(connection["2"]),
      }
    }
    return newEntity
  })

  function remapConnectionData(
    connectionPoint: BlueprintConnectionData[] | undefined,
  ): BlueprintConnectionData[] | undefined {
    return (
      connectionPoint &&
      connectionPoint.map((c) => ({
        entity_id: map[c.entity_id],
        circuit_id: c.circuit_id,
      }))
    )
  }
  function remapConnectionPoint(
    connectionPoint: BlueprintConnectionPoint | undefined,
  ): BlueprintConnectionPoint | undefined {
    return (
      connectionPoint && {
        red: remapConnectionData(connectionPoint.red),
        green: remapConnectionData(connectionPoint.green),
      }
    )
  }
}

export function remapEntityNumbersInArrayPosition<T extends FullEntity>(entities: readonly T[]): T[] {
  const map: Record<EntityNumber, EntityNumber> = {}
  for (const [number, entity] of ipairs(entities)) {
    map[entity.entity_number] = number
  }
  return remapEntityNumbers(entities, map)
}

export type EntityProp = keyof PasteEntity
export const IgnoredProps = {
  entity_number: true,
  position: true,
  isPartialEntity: true,
  isErrorEntity: true,
  changedProps: true,
  tileBox: true,
  connections: true,
  neighbours: true,
} as const
export type IgnoredProp = keyof typeof IgnoredProps

export const UnpasteableProps = {
  name: true,
  items: true,
} as const
export type UnpasteableProp = keyof typeof UnpasteableProps

export const PasteableProps = {
  control_behavior: true,
  override_stack_size: true,
  recipe: true,
  schedule: true,
  direction: true,
} as const
export type PasteableProp = keyof typeof PasteableProps

export const HandledProps = {
  connections: true,
} as const
export type HandledProp = keyof typeof HandledProps

export type UpdateableProp = UnpasteableProp | PasteableProp | HandledProp
