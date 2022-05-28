import { mutableShallowCopy } from "../lib"
import { EntitySampleName, getEntitySample } from "../test/entity-sample"
import { EntityNumber, FullEntity, IgnoredProps, PartialEntity, ReferenceEntity } from "./entity"
import { applyEntityPaste, computeEntityDiff, createReferenceOnlyEntity, isCompatibleEntity } from "./entity-paste"

describe("isCompatibleEntity", () => {
  test("identical entities are compatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = { ...entity }
    assert.is_true(isCompatibleEntity(entity, entity2))
  })

  test("entities of different types are incompatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = getEntitySample("furnace")
    assert.is_false(isCompatibleEntity(entity, entity2))
  })

  test("entities in different positions are incompatible", () => {
    const entity = getEntitySample("chest")
    const entity2 = {
      ...entity,
      position: { x: 100.5, y: 100.5 },
    }
    assert.is_false(isCompatibleEntity(entity, entity2))
  })

  test("manual override position", () => {
    const entity = getEntitySample("chest")
    const entity2 = {
      ...entity,
      position: { x: 100.5, y: 100.5 },
    }
    assert.is_true(isCompatibleEntity(entity, entity2, entity.position))
  })

  test("entities in same fast replace group is compatible", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: entity.position,
    }
    assert.is_true(isCompatibleEntity(entity, entity2))
  })

  test("rotated normal entities are not compatible", () => {
    const entity1 = getEntitySample("inserter")
    const entity2 = {
      ...getEntitySample("rotated-inserter"),
      position: entity1.position,
    }
    assert.is_false(isCompatibleEntity(entity1, entity2))
  })

  test("rotated square assembling machines are compatible", () => {
    const entity1 = getEntitySample("fluid-assembling-machine")
    const entity2 = {
      ...getEntitySample("rotated-fluid-assembling-machine"),
      position: entity1.position,
    }
    assert.is_true(isCompatibleEntity(entity1, entity2))
  })
})

describe("applyEntityPaste", () => {
  function toPartialEntity(entity: FullEntity): PartialEntity {
    return {
      ...entity,
      isPartialEntity: true,
    }
  }

  function assertEntitiesSame(entity: FullEntity, referenceEntity: FullEntity) {
    const comp = mutableShallowCopy(referenceEntity)
    for (const [prop] of pairs(IgnoredProps)) (comp as any)[prop] = (entity as any)[prop]
    assert.same(entity, comp)
  }

  function testEntityPair(below: FullEntity, above: FullEntity, expected: [boolean, boolean]) {
    const pEntity = toPartialEntity(below)
    assert.same(expected, applyEntityPaste(pEntity, above))
    assertEntitiesSame(pEntity, above)
  }

  test("pasting an entity on itself yields self", () => {
    const entity = getEntitySample("chest")
    testEntityPair(entity, entity, [false, false])
  })

  test("pasting a pasteable prop", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = { ...entity, recipe: "iron-gear-wheel" }
    testEntityPair(entity, entity2, [false, false])
  })

  test("pasting a undefined pasteable prop", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity1)
    entity2.recipe = undefined
    testEntityPair(entity1, entity2, [false, false])
  })

  test("pasting an upgrade", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
    testEntityPair(entity1, entity2, [true, false])
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
      testEntityPair(entity1, entity2, [false, true])
    },
  )

  test("empty reference entity: no conflict and changes props on reference entity", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
    const emptyReferenceEntity = createReferenceOnlyEntity(entity2)
    assert.same([false, false], applyEntityPaste(toPartialEntity(entity1), emptyReferenceEntity))
    assertEntitiesSame(entity1, emptyReferenceEntity)
  })

  test("updates prop in below", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const partialEntity = toPartialEntity(entity1)
    const entity2 = { ...getEntitySample("assembling-machine-2"), position: entity1.position }
    assert.same([true, false], applyEntityPaste(partialEntity, entity2))
    assertEntitiesSame(entity2, partialEntity)
  })

  test("updates props in both below and above", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const refEntity: ReferenceEntity = {
      ...entity1,
      name: "assembling-machine-2",
      recipe: "furnace",
      changedProps: new LuaSet("recipe"), // name not considered
    }
    // below has recipe set
    const expectedBelow = {
      ...entity1,
      recipe: "furnace",
      isPartialEntity: true,
    }
    const pEntity = toPartialEntity(entity1)
    assert.same([false, false], applyEntityPaste(pEntity, refEntity))
    assert.same(expectedBelow, pEntity)
    assert.equal(entity1.name, refEntity.name)
  })

  test("returns conflict if is in changedProps", () => {
    const assemblingMachine = getEntitySample("assembling-machine-1")
    const updatedAssemblingMachine: ReferenceEntity = {
      ...assemblingMachine,
      name: "assembling-machine-2",
      changedProps: new LuaSet("name"),
    }
    const [upgraded, itemsChanged] = applyEntityPaste(toPartialEntity(assemblingMachine), updatedAssemblingMachine)
    assert.true(upgraded)
    assert.false(itemsChanged)

    const updatedAssemblingMachine2: ReferenceEntity = {
      ...assemblingMachine,
      items: { "productivity-module": 1 },
      changedProps: new LuaSet("items"),
    }
    const [upgraded2, itemsChanged2] = applyEntityPaste(toPartialEntity(assemblingMachine), updatedAssemblingMachine2)
    assert.false(upgraded2)
    assert.true(itemsChanged2)
  })

  test("updates other props even if there is conflict", () => {
    const assemblingMachine = getEntitySample("assembling-machine-1")
    const updatedAssemblingMachine: ReferenceEntity = {
      ...assemblingMachine,
      name: "assembling-machine-2",
      recipe: "furnace",
      changedProps: new LuaSet("name"), // recipe not considered
    }
    const [upgraded, itemsChanged] = applyEntityPaste(toPartialEntity(assemblingMachine), updatedAssemblingMachine)
    assert.true(upgraded)
    assert.false(itemsChanged)

    assert.same(
      {
        ...assemblingMachine,
        name: "assembling-machine-2",
        changedProps: new LuaSet("name"),
      },
      updatedAssemblingMachine,
    )
  })
})

describe("computeEntityDiff", () => {
  test("returns undefined for identical entities", () => {
    const entity = getEntitySample("assembling-machine-1")
    assert.is_nil(computeEntityDiff(entity, entity, {}))
  })

  test.each(["iron-gear-wheel", false as any], "returns appropriate diff for different entities: %s", (value) => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity1)
    entity2.recipe = value || undefined
    const diff = computeEntityDiff(entity1, entity2, {})
    assert.not_nil(diff)
    assert.same(new LuaSet("recipe"), diff!.changedProps)
  })

  test("adopts entity number of after", () => {
    const entity1 = getEntitySample("assembling-machine-1")
    const entity2 = mutableShallowCopy(entity1)
    entity2.entity_number++
    entity2.recipe = "iron-gear-wheel"
    const diff = computeEntityDiff(entity1, entity2, {})
    assert.equal(entity2.entity_number, diff!.entity_number)
  })

  describe("connections", () => {
    function testConnections(
      old: BlueprintCircuitConnection | undefined,
      cur: BlueprintCircuitConnection | undefined,
      expected: BlueprintCircuitConnection | undefined,
      entityNumberMap: Record<EntityNumber, EntityNumber> = { 1: 1 },
    ) {
      const base = getEntitySample("assembling-machine-1")
      const entity1 = { ...base, connections: old }
      const entity2 = { ...base, connections: cur }
      const diff = computeEntityDiff(entity1, entity2, entityNumberMap)
      if (expected === undefined) {
        assert.is_nil(diff)
      } else {
        assert.same(new LuaSet("connections"), diff!.changedProps)
        assert.same(expected, diff!.connections)
      }
    }

    test("identical", () => {
      const connection = { "1": { red: [{ entity_id: 1 }] } }
      testConnections(connection, connection, undefined)
    })

    test("single add", () => {
      const connection = { "1": { red: [{ entity_id: 1 }] } }
      testConnections(undefined, connection, connection)
    })

    test("different entity id", () => {
      const connection1 = { "1": { red: [{ entity_id: 1 }] } }
      const connection2 = { "1": { red: [{ entity_id: 1 }, { entity_id: 2 }] } }
      const expected = { "1": { red: [{ entity_id: 2 }] } }
      testConnections(connection1, connection2, expected)
    })

    test("different color", () => {
      const connection1 = { "1": { red: [{ entity_id: 1 }] } }
      const connection2 = { "1": { red: [{ entity_id: 1 }], green: [{ entity_id: 1 }] } }
      const expected = { "1": { green: [{ entity_id: 1 }] } }
      testConnections(connection1, connection2, expected)
    })

    test("different point", () => {
      const connection1 = { "1": { red: [{ entity_id: 1 }] } }
      const connection2 = { "1": { red: [{ entity_id: 1 }] }, "2": { red: [{ entity_id: 1 }] } }
      const expected = { "2": { red: [{ entity_id: 1 }] } }
      testConnections(connection1, connection2, expected)
    })
  })
})
