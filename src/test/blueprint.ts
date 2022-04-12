import { Blueprint, MutableBlueprint } from "../blueprint/Blueprint"

export function assertBlueprintsEquivalent(blueprint1: Blueprint, blueprint2: Blueprint): void {
  const bp1 = MutableBlueprint.copyOf(blueprint1)
  const bp2 = MutableBlueprint.copyOf(blueprint2)
  bp1.sortEntities()
  bp2.sortEntities()
  assert.same(bp1.entities, bp2.entities)
}
