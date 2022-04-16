import { Entity, PasteEntity } from "./entity"

// this is only in consideration when entities are compatible
export const enum PropUpdateBehavior {
  Ignored = 0, // not relevant for pasting
  UpdateableOnly = 1, // can be changed manually, but can't be pasted
  IgnoredOnPaste = 2, // does not prevent pasting, but has no effect
  Pasteable = 3, // prop is updated upon paste
}

export const PropUpdateBehaviors = {
  entity_number: PropUpdateBehavior.Ignored,
  position: PropUpdateBehavior.Ignored,
  neighbours: PropUpdateBehavior.Ignored,
  tileBox: PropUpdateBehavior.Ignored,
  changedProps: PropUpdateBehavior.Ignored,

  name: PropUpdateBehavior.UpdateableOnly,

  items: PropUpdateBehavior.IgnoredOnPaste,

  control_behavior: PropUpdateBehavior.Pasteable,
  override_stack_size: PropUpdateBehavior.Pasteable,
  recipe: PropUpdateBehavior.Pasteable,
  schedule: PropUpdateBehavior.Pasteable,
  direction: PropUpdateBehavior.Pasteable, // if direction not pasteable, then entities should not be compatible
  connections: PropUpdateBehavior.Pasteable, // todo: create references for connections

  tags: undefined,
} as const

// get compiler to check that all props are accounted for
;((_: Record<keyof PasteEntity, PropUpdateBehavior | undefined>) => _)(PropUpdateBehaviors)

type UpdateablePropsWithType<T> = keyof {
  [P in keyof BlueprintEntityRead as typeof PropUpdateBehaviors[P] extends T ? P : never]: true
}

export type UpdateableProp = UpdateablePropsWithType<
  PropUpdateBehavior.UpdateableOnly | PropUpdateBehavior.Pasteable | PropUpdateBehavior.IgnoredOnPaste
>

export type UnpasteableProp = UpdateablePropsWithType<PropUpdateBehavior.UpdateableOnly>
export type IgnoredOnPasteProp = UpdateablePropsWithType<PropUpdateBehavior.IgnoredOnPaste>
export type UnhandledProp = UpdateablePropsWithType<undefined>
export type ConflictingProp = UnpasteableProp | IgnoredOnPasteProp | UnhandledProp

export interface EntityReference extends Entity {
  readonly type: "reference"
  readonly changedProps: LuaSet<UpdateableProp> | undefined
}
