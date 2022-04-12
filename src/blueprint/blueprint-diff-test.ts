import { MutableBlueprint } from "./Blueprint"
import { getEntitySample } from "../test/entity-sample"
import { createEntity } from "../entity/entity"
import { findCompatibleEntity, findOverlappingEntity } from "./blueprint-diff"
import { pos } from "../lib/geometry/position"

let b: MutableBlueprint
before_each(() => {
  b = new MutableBlueprint()
})

describe("findCompatibleEntity", () => {
  it("Finds compatible entity", () => {
    const rawEntity = getEntitySample("assembling-machine-1")
    const rawEntity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: rawEntity.position,
    }
    const entity = createEntity(rawEntity)
    b.addSingle(entity)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.equal(entity, result)
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

describe("findOverlappingEntity", () => {
  it("returns overlapping entity", () => {
    const entity = createEntity(getEntitySample("assembling-machine-1"))
    const entity2 = createEntity({
      ...getEntitySample("assembling-machine-2"),
      position: pos.add(entity.position, pos(1, 0)),
    })

    b.addSingle(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.equal(entity, result)
  })
  it("returns undefined when overlapping entity not found", () => {
    const entity = createEntity(getEntitySample("assembling-machine-1"))
    const entity2 = createEntity({
      ...getEntitySample("assembling-machine-2"),
      position: pos.add(entity.position, pos(3, 3)),
    })

    b.addSingle(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.is_nil(result)
  })
})
