import { MutableBlueprint } from "./Blueprint"
import { getEntitySample } from "../test/entity-sample"
import { createEntity } from "../entity/entity"
import { findCompatibleEntity } from "./blueprint-diff"

describe("findCompatibleEntity", () => {
  let b: MutableBlueprint
  before_each(() => {
    b = new MutableBlueprint()
  })

  it("Finds compatible entity", () => {
    const rawEntity = getEntitySample("assembling-machine-1")
    const rawEntity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: rawEntity.position,
    }
    const entity = createEntity(rawEntity)
    b.addSingle(entity)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.equal(result, entity)
  })

  it("returns undefined if no compatible entity is found", () => {
    const rawEntity1 = getEntitySample("assembling-machine-1")
    const rawEntity2 = getEntitySample("chest")
    const entity = createEntity(rawEntity1)
    b.addSingle(entity)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.is_nil(result)
  })
})
