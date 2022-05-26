import { Blueprint } from "../blueprint/Blueprint"
import { Entity, FullEntity, remapEntityNumbersInArrayPosition } from "../entity/entity"

function compareByPosition(a: Entity, b: Entity): boolean {
  const aPos = a.position
  const bPos = b.position
  const ay = aPos.y
  const by = bPos.y
  if (ay !== by) return ay < by
  return aPos.x < bPos.x
}

function sortEntities(entities: Record<number, FullEntity>): FullEntity[] {
  const result = Object.values(entities)
  table.sort(result, compareByPosition)
  return result
}

export function assertBlueprintsEquivalent(expected: Blueprint<FullEntity>, actual: Blueprint<FullEntity>): void {
  const expectedEntities = remapEntityNumbersInArrayPosition(sortEntities(expected.getEntities()))
  const actualEntities = remapEntityNumbersInArrayPosition(sortEntities(actual.getEntities()))
  assert.same(expectedEntities, actualEntities)
}
