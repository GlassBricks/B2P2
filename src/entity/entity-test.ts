import { createEntity, EntityId, withEntityId } from "./entity"

const mockEntity: BlueprintEntityRead = {
  name: "iron-chest",
  position: { x: 1, y: 2 },
  entity_number: 1,
}
test("createEntity with default entity id", () => {
  const result = createEntity(mockEntity)
  assert.equal(mockEntity, result.entity)
  assert.equal(1, result.id)
})

test("createEntity with custom entity number", () => {
  const result = createEntity(mockEntity, 2 as EntityId)
  assert.equal(mockEntity, result.entity)
  assert.equal(2, result.id)
})

test("with entity number", () => {
  const entity1 = createEntity(mockEntity)
  const entity2 = withEntityId(entity1, 2 as EntityId)
  assert.equal(1, entity1.id)
  assert.equal(2, entity2.id)
})
