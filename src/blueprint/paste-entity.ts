import { Entity } from "../entity/entity"
import { UpdateableProp } from "../entity/entity-props"
import { Blueprint } from "./Blueprint"

export interface ReferenceEntity extends Entity {
  readonly diffType: "reference"
  readonly changedProps: ReadonlyLuaSet<UpdateableProp>
}

export type PasteEntity = Entity | ReferenceEntity

export type PasteBlueprint = Blueprint<PasteEntity>
