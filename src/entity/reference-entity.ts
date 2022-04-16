import { Entity } from "./entity"
import { UpdateableProp } from "./entity-props"

export interface ReferenceEntity extends Entity {
  readonly diffType: "reference"
  readonly changedProps: ReadonlyLuaSet<UpdateableProp>
}

export type PasteEntity = Entity | ReferenceEntity
