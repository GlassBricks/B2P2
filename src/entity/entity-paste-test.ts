import { EntitySample, getEntitySample } from "../test/entity-sample"
import { findEntityPasteConflicts } from "./entity-paste"
import { mutableShallowCopy } from "../lib/util"

test("pasting an entity on itself is successful", () => {
  const entity = getEntitySample("chest")
  assert.is_nil(findEntityPasteConflicts(entity, entity))
})

test("pasting a pasteable prop is successful", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = { ...entity, recipe: "iron-gear-wheel" }
  assert.is_nil(findEntityPasteConflicts(entity, entity2))
})

test("pasting recipe from none successful", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity)
  entity2.recipe = undefined
  assert.is_nil(findEntityPasteConflicts(entity, entity2))
})

test("pasting to remove recipe is successful", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity)
  entity2.recipe = undefined
  assert.is_nil(findEntityPasteConflicts(entity, entity2))
})

test("pasting an entity in the same fast replace group is unsuccessful", () => {
  const entity1 = getEntitySample("assembling-machine-1")
  const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
  assert.equal("name", findEntityPasteConflicts(entity1, entity2))
})

test.each<[EntitySample, EntitySample]>(
  [
    ["assembling-machine-2", "assembling-machine-with-modules-1"],
    ["assembling-machine-with-modules-1", "assembling-machine-2"],
    ["assembling-machine-with-modules-1", "assembling-machine-with-modules-2"],
  ],
  "pasting %s to %s",

  (belowName, aboveName) => {
    const entity1 = getEntitySample(belowName)
    const entity2 = {
      ...getEntitySample(aboveName),
      position: entity1.position,
      entity_number: entity1.entity_number,
    }
    assert.equal("items", findEntityPasteConflicts(entity1, entity2))
  },
)

test("reports unhandled props", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity) as any
  entity2.foo = "bar"
  assert.equal("foo", findEntityPasteConflicts(entity, entity2))
  assert.equal("foo", findEntityPasteConflicts(entity2, entity))
})
