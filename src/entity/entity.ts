import { mutableShallowCopy } from "../lib/util"
import { Mutable, RRecord } from "../lib/util-types"
import { computeTileBox } from "./entity-info"

export type EntityNumber = number

export interface Entity extends BlueprintEntityRead {
  readonly tileBox?: BoundingBoxRead
}

export interface PlainEntity extends Entity {
  readonly changedProps?: never
}
export interface ReferenceEntity extends Entity {
  readonly changedProps: ReadonlyLuaSet<UpdateableProp>
}
export type UpdateableReferenceEntity = Mutable<ReferenceEntity>

export type PasteEntity = PlainEntity | ReferenceEntity
export type UpdateablePasteEntity = PlainEntity | UpdateableReferenceEntity

export function getTileBox(entity: Entity): BoundingBoxRead {
  return ((entity as Mutable<Entity>).tileBox ||= computeTileBox(entity))
}

export function withEntityNumber<T extends Entity>(entity: T, number: EntityNumber): T
export function withEntityNumber(entity: BlueprintEntityRead, number: EntityNumber): Entity
export function withEntityNumber<T extends Entity>(entity: T, number: EntityNumber): T {
  if (entity.entity_number === number) return entity
  const result = mutableShallowCopy(entity)
  result.entity_number = number
  return result
}

export function describeEntity(entity: BlueprintEntityRead): LocalisedString {
  return ["entity-name." + entity.name]
}

export type EntityProp = keyof PasteEntity
const ignoredProps = {
  entity_number: true,
  position: true,
  neighbours: true,
  tileBox: true,
  changedProps: true,
} as const
export type IgnoredProp = keyof typeof ignoredProps
export const IgnoredProps = ignoredProps as RRecord<IgnoredProp, true>

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
  connections: true,
} as const
export type PasteableProp = keyof typeof PasteableProps

export type UpdateableProp = UnpasteableProp | PasteableProp

const knownProps = {
  ...ignoredProps,
  ...UnpasteableProps,
  ...PasteableProps,
} as const
export type KnownProp = keyof typeof knownProps
export const KnownProps = knownProps

interface UnhandledProps {
  tags: true
}
export type UnhandledProp = keyof UnhandledProps

export function isUnhandledProp(prop: EntityProp): prop is UnhandledProp {
  return !(prop in knownProps)
}
export function isKnownProp(prop: EntityProp): prop is KnownProp {
  return prop in knownProps
}

export type ConflictingProp = UnpasteableProp | UnhandledProp
;((_: Record<keyof PasteEntity, true>) => _)(0 as unknown as typeof knownProps & typeof PasteableProps & UnhandledProps)
