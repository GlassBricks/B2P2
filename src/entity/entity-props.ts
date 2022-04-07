import { Entity } from "./entity"

// this is only in consideration when entities are compatible
export const enum PropUpdateBehavior {
  Irrelevant = 0, // not relevant for pasting
  UpdateableOnly = 1, // can be changed manually, but can't be pasted
  IgnoredOnPaste = 2, // does not prevent pasting, but has no effect
  Pasteable = 3, // prop is updated upon paste
}

export const PropUpdateBehaviors = {
  entity_number: PropUpdateBehavior.Irrelevant,
  position: PropUpdateBehavior.Irrelevant,

  direction: PropUpdateBehavior.Pasteable, // if direction not pasteable, then entities should not be compatible

  name: PropUpdateBehavior.UpdateableOnly,

  items: PropUpdateBehavior.IgnoredOnPaste,

  control_behavior: PropUpdateBehavior.Pasteable,
  override_stack_size: PropUpdateBehavior.Pasteable,
  recipe: PropUpdateBehavior.Pasteable,
  schedule: PropUpdateBehavior.Pasteable,

  connections: undefined,
  tags: undefined,
} as const

// get compiler to check that all props are accounted for
;((_: Record<keyof BlueprintEntityRead, PropUpdateBehavior | undefined>) => _)(PropUpdateBehaviors)

type UpdateablePropsWithType<T> = keyof {
  [P in keyof BlueprintEntityRead as typeof PropUpdateBehaviors[P] extends T ? P : never]: true
}

export type UpdateableProp = UpdateablePropsWithType<
  PropUpdateBehavior.UpdateableOnly | PropUpdateBehavior.Pasteable | PropUpdateBehavior.IgnoredOnPaste
>

export type NotPasteableProp = UpdateablePropsWithType<PropUpdateBehavior.UpdateableOnly>
export type IgnoredOnPasteProp = UpdateablePropsWithType<PropUpdateBehavior.IgnoredOnPaste>

export interface EntityReference extends Entity {
  readonly type: "reference"
  readonly changedProps: LuaSet<UpdateableProp> | undefined
}
