// noinspection JSUnusedGlobalSymbols

import { Mutable, mutableShallowCopy } from "../lib"
import { BBox } from "../lib/geometry"
import { computeTileBox } from "./entity-info"

export type EntityNumber = number

/** Minimally enough information to identify an existing entity. */
export type Entity = Pick<BlueprintEntityRead, "name" | "position" | "direction">

export interface FullEntity extends Entity, BlueprintEntityRead {
  readonly tileBox?: BBox
}

export interface PlainEntity extends FullEntity {
  readonly changedProps?: never
}
export interface ReferenceEntity extends FullEntity {
  readonly changedProps: LuaSet<UpdateableProp>
}
export type UpdateableReferenceEntity = Mutable<ReferenceEntity>

export type PasteEntity = PlainEntity | ReferenceEntity
export type UpdateablePasteEntity = PlainEntity | UpdateableReferenceEntity

export function getTileBox(entity: Entity): BBox {
  return ((entity as Mutable<FullEntity>).tileBox ||= computeTileBox(entity))
}

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
  neighbours: true,
  tileBox: true,
  changedProps: true,
  connections: true,
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
