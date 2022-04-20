import { Entity, EntityNumber, getTileBox, remapEntityNumbersInArrayPosition, withEntityNumber } from "./entity"
import { computeTileBox } from "./entity-info"

const mockEntity: Entity = {
  name: "iron-chest",
  position: { x: 1.5, y: 2.5 },
  entity_number: 1,
}
const mockEntity2: Entity = {
  name: "wooden-chest",
  position: { x: 1.5, y: 2.5 },
  entity_number: 2,
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

test("remapEntityNumbersInArrayPosition", () => {
  const connections2: BlueprintCircuitConnection = {
    "1": { red: [{ entity_id: 2 }] },
  }
  const connections1: BlueprintCircuitConnection = {
    "1": { red: [{ entity_id: 1 }] },
  }

  const entity1 = {
    ...mockEntity,
    connections: connections2,
    neighbours: [2],
  }
  const entity2 = {
    ...mockEntity2,
    connections: connections1,
    neighbours: [1],
  }
  const swappedEntity1 = {
    ...mockEntity,
    entity_number: 2,
    connections: connections1,
    neighbours: [1],
  }
  const swappedEntity2 = {
    ...mockEntity2,
    entity_number: 1,
    connections: connections2,
    neighbours: [2],
  }
  const remapped = remapEntityNumbersInArrayPosition([entity2, entity1])
  const expected = [swappedEntity2, swappedEntity1]
  assert.same(expected, remapped)
})
