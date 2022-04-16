import { Entity, EntityNumber, getTileBox, withEntityNumber } from "./entity"
import { computeTileBox } from "./entity-info"

const mockEntity: Entity = {
  name: "iron-chest",
  position: { x: 1.5, y: 2.5 },
  entity_number: 1,
}

test("with entity number", () => {
  const entity2 = withEntityNumber(mockEntity, 2 as EntityNumber)
  assert.equal(1, mockEntity.entity_number)
  assert.equal(2, entity2.entity_number)
})

test("getTileBox matches computeTileBox", () => {
  const tileBox = getTileBox(mockEntity)
  const expected = computeTileBox(mockEntity)
  assert.same(expected, tileBox)
})
