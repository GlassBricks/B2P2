import { FullEntity, PasteEntity, ReferenceEntity } from "../entity/entity"
import { createReferenceOnlyEntity } from "../entity/entity-paste"
import { BoundingBoxClass } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { getEntitySample } from "../test/entity-sample"
import { getWorkingArea1 } from "../test/misc"
import { Blueprint } from "./Blueprint"
import { BlueprintDiff, computeBlueprintDiff } from "./blueprint-diff"
import {
  findBlueprintPasteConflicts,
  findBlueprintPasteConflictsAndUpdate,
  findBlueprintPasteConflictsInWorld,
  findCompatibleEntity,
  findOverlappingEntity,
} from "./blueprint-paste"
import { clearBuildableEntities, pasteBlueprint } from "./world"

let emptyBlueprint: Blueprint
function getAssemblingMachineEntity(): FullEntity {
  return {
    ...getEntitySample("assembling-machine-1"),
    position: pos(3.5, 3.5),
  }
}
let singleAssemblerBlueprint: Blueprint
let noDiff: BlueprintDiff

before_all(() => {
  emptyBlueprint = Blueprint.of()

  singleAssemblerBlueprint = Blueprint.of(getAssemblingMachineEntity())
  noDiff = { content: emptyBlueprint }
})

describe("findCompatibleEntity", () => {
  it("Finds compatible entity", () => {
    const rawEntity = getEntitySample("assembling-machine-1")
    const rawEntity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: rawEntity.position,
    }
    const b = Blueprint.of(rawEntity)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.equal(rawEntity, result)
  })

  it("returns undefined if no compatible entity is found", () => {
    const rawEntity1 = getEntitySample("assembling-machine-1")
    const rawEntity2 = getEntitySample("chest")
    const b = Blueprint.of(rawEntity1)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.is_nil(result)
  })
})

describe("findOverlappingEntity", () => {
  it("returns overlapping entity", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: pos.add(entity.position, pos(1, 0)),
    }

    const b = Blueprint.of(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.equal(entity, result)
  })
  it("returns undefined when overlapping entity not found", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: pos.add(entity.position, pos(3, 3)),
    }

    const b = Blueprint.of(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.is_nil(result)
  })
})

describe("findBlueprintPasteConflicts", () => {
  it("pasting empty on empty produces no conflicts", () => {
    assert.same({}, findBlueprintPasteConflicts(emptyBlueprint, emptyBlueprint))
  })

  it("pasting empty on basic produces no conflicts", () => {
    assert.same({}, findBlueprintPasteConflicts(singleAssemblerBlueprint, emptyBlueprint))
  })

  it("pasting basic on empty produces no conflicts", () => {
    assert.same({}, findBlueprintPasteConflicts(emptyBlueprint, singleAssemblerBlueprint))
  })

  it("pasting basic on identical produces no conflicts", () => {
    assert.same({}, findBlueprintPasteConflicts(singleAssemblerBlueprint, singleAssemblerBlueprint))
  })

  it("detects overlapping entities", () => {
    const movedAssemblingMachine = {
      ...getAssemblingMachineEntity(),
      position: pos(1.5, 1.5),
    }
    const blueprint2 = Blueprint.of(movedAssemblingMachine)
    const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
    assert.same(
      [
        {
          below: getAssemblingMachineEntity(),
          above: movedAssemblingMachine,
        },
      ],
      conflicts.overlaps,
    )
    assert.is_nil(conflicts.propConflicts)
    assert.is_nil(conflicts.lostReferences)
  })

  it("detects entity incompatibilities", () => {
    const asm2 = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
    }
    const blueprint2 = Blueprint.of(asm2)
    const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
    assert.same(
      [
        {
          below: getAssemblingMachineEntity(),
          above: asm2,
          prop: "name",
        },
      ],
      conflicts.propConflicts,
    )
    assert.is_nil(conflicts.overlaps)
    assert.is_nil(conflicts.lostReferences)
  })
})
describe("findBlueprintPasteConflictsAndUpdate", () => {
  it("detects reference entities without reference", () => {
    const asm = createReferenceOnlyEntity(getAssemblingMachineEntity())
    const bp2 = Blueprint.of(asm)
    const conflicts = findBlueprintPasteConflictsAndUpdate(emptyBlueprint, bp2)
    assert.same([asm], conflicts.lostReferences)
    assert.is_nil(conflicts.overlaps)
    assert.is_nil(conflicts.propConflicts)
  })

  it("updates other props to match", () => {
    // this largely relies on findEntityPasteConflictAndUpdate
    const updatedAssemblingMachine: ReferenceEntity = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
      recipe: "furnace",
      changedProps: new LuaSet("recipe"), // name not considered
    }
    const blueprint2 = Blueprint.of(updatedAssemblingMachine)
    const conflicts = findBlueprintPasteConflictsAndUpdate(singleAssemblerBlueprint, blueprint2)
    assert.same({}, conflicts)

    assert.same(
      {
        ...getAssemblingMachineEntity(),
        // name: "assembling-machine-2",
        recipe: "furnace",
        changedProps: new LuaSet("recipe"),
      },
      updatedAssemblingMachine,
    )
  })
})

describe("findBlueprintPasteConflictsInWorld", () => {
  let surface: LuaSurface
  let area: BoundingBoxClass
  before_all(() => {
    ;[surface, area] = getWorkingArea1()
    clearBuildableEntities(surface, area)
    pasteBlueprint(surface, area.left_top, singleAssemblerBlueprint.entities, area)
  })
  test("overlap", () => {
    const movedAssemblingMachine = {
      ...getAssemblingMachineEntity(),
      position: pos(1.5, 1.5),
    }
    const blueprint2 = Blueprint.of(movedAssemblingMachine)
    const conflicts = findBlueprintPasteConflictsInWorld(surface, area, blueprint2, area.left_top)
    assert.same(
      [
        {
          below: getAssemblingMachineEntity(),
          above: movedAssemblingMachine,
        },
      ],
      conflicts.overlaps,
    )
    assert.is_nil(conflicts.propConflicts)
    assert.is_nil(conflicts.lostReferences)
  })
  test("no overlap", () => {
    const conflicts = findBlueprintPasteConflictsInWorld(surface, area, singleAssemblerBlueprint, area.left_top)
    assert.same({}, conflicts)
  })
})

function assertDiffsSame(expected: BlueprintDiff, actual: BlueprintDiff) {
  assert.same(expected.deletions, actual.deletions, "deletions")
  assertBlueprintsEquivalent(expected.content, actual.content)
}

describe("computeBlueprintDiff", () => {
  it("should return empty diff if no changes", () => {
    const blueprintSample = Blueprint.fromArray(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(blueprintSample, blueprintSample)
    assertDiffsSame(noDiff, diff)
  })

  it("should return exactly contents when compared to empty blueprint", () => {
    const blueprintSample = Blueprint.fromArray(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(emptyBlueprint, blueprintSample)
    assertDiffsSame(
      {
        content: blueprintSample,
      },
      diff,
    )
  })

  it("should only include changed entities", () => {
    const original = Blueprint.fromArray(getBlueprintSample("original"))
    const added = Blueprint.fromArray(getBlueprintSample("add chest"))
    const diff = computeBlueprintDiff(original, added)
    const expectedDiff = Blueprint.of(added.asArray().find((x) => x.name === "iron-chest")!)
    assertDiffsSame(
      {
        content: expectedDiff,
      },
      diff,
    )
  })

  it("should detect a single deleted entity", () => {
    const original = singleAssemblerBlueprint
    const result = emptyBlueprint
    const diff = computeBlueprintDiff(original, result)
    assertDiffsSame(
      {
        content: result,
        deletions: [getAssemblingMachineEntity()],
      },
      diff,
    )
  })

  it("should create update entities when compatible", () => {
    const asm1Bp = singleAssemblerBlueprint
    const asm2 = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
    }
    const asm2Bp = Blueprint.of(asm2)
    const diff = computeBlueprintDiff(asm1Bp, asm2Bp)
    const asm2Diff: ReferenceEntity = {
      ...asm2,
      changedProps: new LuaSet("name"),
    }
    const expectedContent = Blueprint.of(asm2Diff)
    assertDiffsSame(
      {
        content: expectedContent,
      },
      diff,
    )
  })

  describe("circuit connections", () => {
    it("should create an reference entity when connected to new entity", () => {
      const original = Blueprint.fromArray(getBlueprintSample("original"))
      const added = Blueprint.fromArray(getBlueprintSample("pole circuit add"))
      const diff = computeBlueprintDiff(original, added).content.asArray()
      assert.equal(2, diff.length)
      const inserter = diff.find((x) => x.name === "inserter")!
      assert.same(new LuaSet("connections"), inserter.changedProps)
      const pole = diff.find((x) => x.name === "small-electric-pole")!
      assert.not_nil(pole)
      assert.is_nil(pole.changedProps)
    })

    it("should create reference entities for new connection to existing entities", () => {
      const original = Blueprint.fromArray(getBlueprintSample("original"))
      const added = Blueprint.fromArray(getBlueprintSample("circuit wire add"))
      const diff = computeBlueprintDiff(original, added).content.asArray()
      assert.equal(2, diff.length)
      function checkEntity(entity: PasteEntity | undefined, name: string) {
        ;[entity] = assert(entity, name)
        assert.same(new LuaSet("connections"), entity.changedProps)
        assert.same(1, entity.connections?.["1"]?.green?.length)
        // should not include the existing connection
        assert.is_nil(entity.connections?.["1"]?.red)
        assert.is_nil(entity.connections?.["2"])
      }

      const inserter = diff.find((x) => x.name === "inserter")!
      checkEntity(inserter, "inserter")
      const pole = diff.find((x) => x.name === "small-electric-pole")!
      checkEntity(pole, "small-electric-pole")
    })
  })
})
