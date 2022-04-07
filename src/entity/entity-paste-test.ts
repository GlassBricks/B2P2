import { EntitySample, getEntitySample } from "../test/entity-sample"
import { FailedPasteResult, SuccessfulPasteResult, tryPasteCompatibleEntities } from "./entity-paste"
import { mutableShallowCopy, mutate } from "../lib/util"

test("pasting an entity on itself is successful and does not change the entity", () => {
  const entity = getEntitySample("chest")
  const [success, pasteResult] = tryPasteCompatibleEntities(entity, entity)
  assert(success)
  assert.same(entity, (pasteResult as SuccessfulPasteResult).entity)
})

test("pasting a pasteable prop is successful and updates the prop", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = { ...entity, recipe: "iron-gear-wheel" }
  const [success, pasteResult] = tryPasteCompatibleEntities(entity, entity2)
  assert(success)
  assert.same(entity2, (pasteResult as SuccessfulPasteResult).entity)
})

test("pasting recipe from none successful and updates the prop", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity)
  entity2.recipe = undefined
  const [success, pasteResult] = tryPasteCompatibleEntities(entity2, entity)
  assert(success)
  assert.same(entity, (pasteResult as SuccessfulPasteResult).entity)
})

test("pasting to remove recipe is successful and updates the prop", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity)
  entity2.recipe = undefined
  const [success, pasteResult] = tryPasteCompatibleEntities(entity, entity2)
  assert(success)
  assert.same(entity2, (pasteResult as SuccessfulPasteResult).entity)
})

test("pasting a pasteable prop preserves entity number", () => {
  const entity = getEntitySample("assembling-machine-1")
  const entity2 = mutableShallowCopy(entity)
  entity2.entity_number++
  const [success, pasteResult] = tryPasteCompatibleEntities(entity, entity2)
  assert(success)
  assert.same(entity, (pasteResult as SuccessfulPasteResult).entity)
})

test("pasting an entity in the same fast replace group is unsuccessful", () => {
  const entity1 = getEntitySample("assembling-machine-1")
  const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
  const [success, pasteResult] = tryPasteCompatibleEntities(entity1, entity2)
  assert(!success)
  assert.equal("name", (pasteResult as FailedPasteResult).conflictingProp)
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
    const [success, pasteResult] = tryPasteCompatibleEntities(entity1, entity2)
    assert(success)
    assert.same(
      mutate(entity2, (e) => (e.items = entity1.items)),
      (pasteResult as SuccessfulPasteResult).entity,
    )
    assert.same(["items"], (pasteResult as SuccessfulPasteResult).ignoredProps)
  },
)
