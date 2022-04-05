import { createEntity, EntityNumber, withEntityNumber } from "./entity"

const mockEntity: BlueprintEntityRead = {
  name: "iron-chest",
  position: { x: 1, y: 2 },
  entity_number: 1,
}
test("createEntity with default entity number", () => {
  const result = createEntity(mockEntity, 1 as EntityNumber)
  assert.equal(mockEntity, result.entity)
  assert.equal(1, result.number)
})

test("createEntity with custom entity number", () => {
  const result = createEntity(mockEntity, 2 as EntityNumber)
  assert.equal(mockEntity, result.entity)
  assert.equal(2, result.number)
})

test("with entity number", () => {
  const entity1 = createEntity(mockEntity, 1 as EntityNumber)
  const entity2 = withEntityNumber(entity1, 2 as EntityNumber)
  assert.equal(1, entity1.number)
  assert.equal(2, entity2.number)
})
