import { createEntity, EntityNumber, withEntityNumber } from "./entity"

const mockEntity: BlueprintEntityRead = {
  name: "iron-chest",
  position: { x: 1, y: 2 },
  entity_number: 1,
}

test("createEntity with default entity entity_number", () => {
  const result = createEntity(mockEntity)
  assert.equal(1, result.entity_number)
})

test("createEntity with custom entity number", () => {
  const result = createEntity(mockEntity, 2 as EntityNumber)
  assert.equal(2, result.entity_number)
})

test("with entity number", () => {
  const entity1 = createEntity(mockEntity)
  const entity2 = withEntityNumber(entity1, 2 as EntityNumber)
  assert.equal(1, entity1.entity_number)
  assert.equal(2, entity2.entity_number)
})
