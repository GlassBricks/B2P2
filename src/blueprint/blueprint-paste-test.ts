import { Blueprint, MutableBlueprint } from "./Blueprint"
import { Entity, PasteEntity, ReferenceEntity, UpdateablePasteEntity } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import { pos } from "../lib/geometry/position"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflictAndUpdate,
  findBlueprintPasteConflicts,
  findBlueprintPasteConflictsInWorldAndUpdate,
  findCompatibleEntity,
  findOverlappingEntity,
} from "./blueprint-paste"
import { getBlueprintSample } from "../test/blueprint-sample"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { createReferenceOnlyEntity } from "../entity/entity-paste"

let emptyBlueprint: Blueprint
function getAssemblingMachineEntity(): Entity {
  return {
    ...getEntitySample("assembling-machine-1"),
    position: pos(3.5, 3.5),
  }
}
let singleAssemblerBlueprint: Blueprint
let noDiff: BlueprintDiff

before_all(() => {
  emptyBlueprint = new MutableBlueprint()

  const saBlueprint = new MutableBlueprint()
  saBlueprint.addSingle(getAssemblingMachineEntity())
  singleAssemblerBlueprint = saBlueprint
  noDiff = {
    content: emptyBlueprint,
    deletions: [],
  }
})
const noConflicts: BlueprintPasteConflicts = {
  overlaps: [],
  propConflicts: [],
  lostReferences: [],
}

let b: MutableBlueprint
before_each(() => {
  b = new MutableBlueprint()
})

describe("findCompatibleEntity", () => {
  it("Finds compatible entity", () => {
    const rawEntity = getEntitySample("assembling-machine-1")
    const rawEntity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: rawEntity.position,
    }
    b.addSingle(rawEntity)
    const result = findCompatibleEntity(b, rawEntity2)
    assert.equal(rawEntity, result)
  })

  it("returns undefined if no compatible entity is found", () => {
    const rawEntity1 = getEntitySample("assembling-machine-1")
    const rawEntity2 = getEntitySample("chest")
    b.addSingle(rawEntity1)
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

    b.addSingle(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.equal(entity, result)
  })
  it("returns undefined when overlapping entity not found", () => {
    const entity = getEntitySample("assembling-machine-1")
    const entity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: pos.add(entity.position, pos(3, 3)),
    }

    b.addSingle(entity)

    const result = findOverlappingEntity(b, entity2)
    assert.is_nil(result)
  })
})

describe("findBlueprintPasteConflicts", () => {
  it("pasting empty on empty produces no conflicts", () => {
    assert.same(noConflicts, findBlueprintPasteConflicts(emptyBlueprint, emptyBlueprint))
  })

  it("pasting empty on basic produces no conflicts", () => {
    assert.same(noConflicts, findBlueprintPasteConflicts(singleAssemblerBlueprint, emptyBlueprint))
  })

  it("pasting basic on empty produces no conflicts", () => {
    assert.same(noConflicts, findBlueprintPasteConflicts(emptyBlueprint, singleAssemblerBlueprint))
  })

  it("pasting basic on identical produces no conflicts", () => {
    assert.same(noConflicts, findBlueprintPasteConflicts(singleAssemblerBlueprint, singleAssemblerBlueprint))
  })

  it("detects overlapping entities", () => {
    const movedAssemblingMachine = {
      ...getAssemblingMachineEntity(),
      position: pos(1.5, 1.5),
    }
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(movedAssemblingMachine)
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
    assert.same([], conflicts.propConflicts)
    assert.same([], conflicts.lostReferences)
  })

  it("detects entity incompatibilities", () => {
    const asm2 = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
    }
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(asm2)
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
    assert.same([], conflicts.overlaps)
    assert.same([], conflicts.lostReferences)
  })
})
describe("findBlueprintPasteConflictsAndUpdate", () => {
  it("detects reference entities without reference", () => {
    const asm = createReferenceOnlyEntity(getAssemblingMachineEntity())
    const bp2 = new MutableBlueprint<PasteEntity>()
    bp2.addSingle(asm)
    const conflicts = findBlueprintPasteConflictAndUpdate(emptyBlueprint, bp2)
    assert.same([], conflicts.overlaps)
    assert.same([], conflicts.propConflicts)
    assert.same([asm], conflicts.lostReferences)
  })

  it("updates other props to match", () => {
    // this largely relies on findEntityPasteConflictAndUpdate
    const updatedAssemblingMachine: ReferenceEntity = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
      recipe: "furnace",
      changedProps: new LuaSet("recipe"), // name not considered
    }
    const blueprint2 = new MutableBlueprint<UpdateablePasteEntity>()
    const resultEntity = blueprint2.addSingle(updatedAssemblingMachine)
    const conflicts = findBlueprintPasteConflictAndUpdate(singleAssemblerBlueprint, blueprint2)
    assert.same([], conflicts.propConflicts) // "name" not considered
    assert.same([], conflicts.overlaps)
    assert.same([], conflicts.lostReferences)

    assert.same(
      {
        ...getAssemblingMachineEntity(),
        // name: "assembling-machine-2",
        recipe: "furnace",
        changedProps: new LuaSet("recipe"),
      },
      resultEntity,
    )
  })
})

describe("findBlueprintPasteConflictsInWorld", () => {
  let surface: LuaSurface
  let area: BoundingBoxClass
  before_all(() => {
    const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
    area = bbox.normalize(area1)
    surface = surface1
    clearBuildableEntities(surface, area)
    pasteBlueprint(surface, area.left_top, singleAssemblerBlueprint.getAsArray(), area)
  })
  test("overlap", () => {
    const movedAssemblingMachine = {
      ...getAssemblingMachineEntity(),
      position: pos(1.5, 1.5),
    }
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(movedAssemblingMachine)
    const conflicts = findBlueprintPasteConflictsInWorldAndUpdate(surface, area, blueprint2, area.left_top)
    assert.same(
      [
        {
          below: getAssemblingMachineEntity(),
          above: movedAssemblingMachine,
        },
      ],
      conflicts.overlaps,
    )
    assert.same([], conflicts.propConflicts)
    assert.same([], conflicts.lostReferences)
  })
  test("no overlap", () => {
    const conflicts = findBlueprintPasteConflictsInWorldAndUpdate(
      surface,
      area,
      singleAssemblerBlueprint,
      area.left_top,
    )
    assert.same([], conflicts.overlaps)
    assert.same([], conflicts.propConflicts)
  })
})

function assertDiffsSame(expected: BlueprintDiff, actual: BlueprintDiff) {
  assert.same(expected.deletions, actual.deletions)
  assertBlueprintsEquivalent(expected.content, actual.content)
}

describe("computeBlueprintDiff", () => {
  it("should return empty diff if no changes", () => {
    const blueprintSample = MutableBlueprint.fromArray(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(blueprintSample, blueprintSample)
    assertDiffsSame(noDiff, diff)
  })

  it("should return exactly contents when compared to empty blueprint", () => {
    const blueprintSample = MutableBlueprint.fromArray(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(emptyBlueprint, blueprintSample)
    assertDiffsSame(
      {
        content: blueprintSample,
        deletions: [],
      },
      diff,
    )
  })

  it("should only include changed entities", () => {
    const original = MutableBlueprint.fromArray(getBlueprintSample("original"))
    const added = MutableBlueprint.fromArray(getBlueprintSample("add chest"))
    const diff = computeBlueprintDiff(original, added)
    const expectedDiff = MutableBlueprint.fromArray([added.getAsArray().find((x) => x.name === "iron-chest")!])
    assertDiffsSame(
      {
        content: expectedDiff,
        deletions: [],
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
    const asm2Bp = MutableBlueprint.fromArray([asm2])
    const diff = computeBlueprintDiff(asm1Bp, asm2Bp)
    const asm2Diff: ReferenceEntity = {
      ...asm2,
      changedProps: new LuaSet("name"),
    }
    const expectedContent = new MutableBlueprint<PasteEntity>()
    expectedContent.addSingle(asm2Diff)
    assertDiffsSame(
      {
        content: expectedContent,
        deletions: [],
      },
      diff,
    )
  })
})
