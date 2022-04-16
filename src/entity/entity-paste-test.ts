import { EntitySampleName, getEntitySample } from "../test/entity-sample"
import { computeEntityDiff, findEntityPasteConflict } from "./entity-paste"
import { mutableShallowCopy } from "../lib/util"

describe("findEntityPasteConflict", () => {
  test("pasting an entity on itself is successful", () => {
    const entity = getEntitySample("chest")
    assert.is_nil(findEntityPasteConflict(entity, entity))
  })

  test("pasting a pasteable prop is successful", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = { ...entity, recipe: "iron-gear-wheel" }
    assert.is_nil(findEntityPasteConflict(entity, entity2))
  })

  test("pasting recipe from none successful", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity)
    entity2.recipe = undefined
    assert.is_nil(findEntityPasteConflict(entity, entity2))
  })

  test("pasting to remove recipe is successful", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity)
    entity2.recipe = undefined
    assert.is_nil(findEntityPasteConflict(entity, entity2))
  })

  test("pasting an entity in the same fast replace group is unsuccessful", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
    assert.equal("name", findEntityPasteConflict(entity1, entity2))
  })

  test.each<[EntitySampleName, EntitySampleName]>(
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
      assert.equal("items", findEntityPasteConflict(entity1, entity2))
    },
  )

  test("reports unhandled props", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity) as any
    entity2.foo = "bar"
    assert.equal("foo", findEntityPasteConflict(entity, entity2))
    assert.equal("foo", findEntityPasteConflict(entity2, entity))
  })

  test("does not report unhandled props if identical", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity) as any
    entity2.foo = "bar"
    assert.equal(undefined, findEntityPasteConflict(entity2, entity2))
  })
})

describe("computeEntityDiff", () => {
  test("returns undefined for identical entities", () => {
    const entity = getEntitySample("assembling-machine-1")
    assert.is_nil(computeEntityDiff(entity, entity))
  })

  test.each(["iron-gear-wheel", false as any], "returns appropriate diff for different entities: %s", (value) => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity1)
    entity2.recipe = value || undefined
    const diff = computeEntityDiff(entity1, entity2)
    assert.not_nil(diff)
    assert.same(new LuaSet("recipe"), diff!.changedProps)
  })
})
