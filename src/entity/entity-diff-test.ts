import { getEntitySample } from "../test/entity-sample"
import { isCompatibleEntity } from "./entity-diff"

describe("isCompatibleEntity", () => {
  test("identical entities are compatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = { ...entity }
    assert.is_true(isCompatibleEntity(entity, entity2))
  })

  test("entities of different types are incompatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = getEntitySample("furnace")
    assert.is_false(isCompatibleEntity(entity, entity2))
  })

  test("entities in different positions are incompatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = {
      ...entity,
      position: { x: 100.5, y: 100.5 },
    }
    assert.is_false(isCompatibleEntity(entity, entity2))
  })

  test("entities in same fast replace group is compatible", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: entity.position,
    }
    assert.is_true(isCompatibleEntity(entity, entity2))
  })

  test("rotated normal entities are not compatible", () => {
    const entity1 = getEntitySample("inserter")
    const entity2 = {
      ...getEntitySample("rotated-inserter"),
      position: entity1.position,
    }
    assert.is_false(isCompatibleEntity(entity1, entity2))
  })

  test("rotated square assembling machines are compatible", () => {
    const entity1 = getEntitySample("fluid-assembling-machine")
    const entity2 = {
      ...getEntitySample("rotated-fluid-assembling-machine"),
      position: entity1.position,
    }
    assert.is_true(isCompatibleEntity(entity1, entity2))
  })
})
