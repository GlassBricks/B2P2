import { Blueprint } from "../blueprint/Blueprint"
import { Entity } from "../entity/entity"

export function assertBlueprintsEquivalent(expected: Blueprint<Entity>, actual: Blueprint<Entity>): void {
  assert.same(expected.sorted().entities, actual.sorted().entities)
}
