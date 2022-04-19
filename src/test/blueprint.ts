import { Blueprint } from "../blueprint/Blueprint"
import { Entity, remapEntityNumbersInArrayPosition } from "../entity/entity"

function compareByPosition(a: Entity, b: Entity): boolean {
  const aPos = a.position
  const bPos = b.position
  const ay = aPos.y
  const by = bPos.y
  if (ay !== by) return ay < by
  return aPos.x < bPos.x
}

function sortEntities(entities: Record<number, Entity>): Entity[] {
  const result = Object.values(entities)
  table.sort(result, compareByPosition)
  return result
}

export function assertBlueprintsEquivalent(expected: Blueprint<Entity>, actual: Blueprint<Entity>): void {
  const expectedEntities = remapEntityNumbersInArrayPosition(sortEntities(expected.entities))
  const actualEntities = remapEntityNumbersInArrayPosition(sortEntities(actual.entities))
  assert.same(expectedEntities, actualEntities)
}
