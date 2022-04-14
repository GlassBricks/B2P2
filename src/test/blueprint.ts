import { Blueprint, MutableBlueprint } from "../blueprint/Blueprint"
import { Entity } from "../entity/entity"

export function assertBlueprintsEquivalent(expected: Blueprint<Entity>, actual: Blueprint<Entity>): void {
  const bp1 = MutableBlueprint.copyOf(expected)
  const bp2 = MutableBlueprint.copyOf(actual)
  bp1.sortEntities()
  bp2.sortEntities()
  assert.same(bp1.entities, bp2.entities)
}
