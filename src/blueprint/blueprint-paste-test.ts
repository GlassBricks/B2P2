import { FullEntity, ReferenceEntity } from "../entity/entity"
import { createReferenceOnlyEntity } from "../entity/entity-paste"
import { assertNever, mutableShallowCopy } from "../lib"
import { BoundingBoxClass, pos, Position } from "../lib/geometry"
import { BlueprintSampleName, BlueprintSampleNames, getBlueprintSample } from "../test/blueprint-sample"
import { getEntitySample } from "../test/entity-sample"
import { getWorkingArea1 } from "../test/misc"
import { Blueprint, PasteBlueprint } from "./Blueprint"
import { BlueprintPasteConflicts, EntityPair, findCompatibleEntity, pasteAndFindConflicts } from "./blueprint-paste"
import { clearBuildableEntities, pasteBlueprint } from "./world"

let emptyBlueprint: Blueprint
function getAssemblingMachineEntity(): FullEntity {
  return {
    ...getEntitySample("assembling-machine-1"),
    position: pos(3.5, 3.5),
  }
}
let singleAssemblerBlueprint: Blueprint

before_all(() => {
  emptyBlueprint = Blueprint.of()
  singleAssemblerBlueprint = Blueprint.of(getAssemblingMachineEntity())
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

describe("pasteAndFindConflicts", () => {
  let surface: LuaSurface
  let area: BoundingBoxClass
  before_all(() => {
    ;[surface, area] = getWorkingArea1()
  })
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  function testBPs(below: Blueprint, above: PasteBlueprint, pasteLocation: Position = area.left_top) {
    pasteBlueprint(surface, pasteLocation, below.entities)
    return pasteAndFindConflicts(surface, area, above, pasteLocation)
  }

  it("pasting empty on empty produces no conflicts", () => {
    assert.same({}, testBPs(emptyBlueprint, emptyBlueprint)[0])
  })

  it("pasting empty on basic produces no conflicts", () => {
    assert.same({}, testBPs(singleAssemblerBlueprint, emptyBlueprint)[0])
  })

  it("pasting basic on empty produces no conflicts", () => {
    assert.same({}, testBPs(emptyBlueprint, singleAssemblerBlueprint)[0])
  })

  it("pasting basic on identical produces no conflicts", () => {
    assert.same({}, testBPs(singleAssemblerBlueprint, singleAssemblerBlueprint)[0])
  })

  it("works pasting in different location", () => {
    const location = pos.add(area.left_top, pos(2, 2))
    assert.same({}, testBPs(emptyBlueprint, singleAssemblerBlueprint, location)[0])
  })

  it("detects overlapping entities", () => {
    const movedAssemblingMachine = {
      ...getAssemblingMachineEntity(),
      position: pos(1.5, 1.5),
    }
    const blueprint2 = Blueprint.of(movedAssemblingMachine)
    const conflicts = testBPs(singleAssemblerBlueprint, blueprint2)[0]
    assert.same([movedAssemblingMachine], conflicts.overlaps)
    assert.same(["overlaps"], Object.keys(conflicts), "no other conflicts")
  })

  it("detects entity incompatibilities", () => {
    const asm2 = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
    }
    const blueprint2 = Blueprint.of(asm2)
    const conflicts = testBPs(singleAssemblerBlueprint, blueprint2)[0]
    assert.same(
      [
        {
          below: getAssemblingMachineEntity(),
          above: asm2,
        },
      ],
      conflicts.upgrades,
    )
    assert.same(["upgrades"], Object.keys(conflicts), "no other conflicts")
  })

  it("detects reference entities without reference", () => {
    const asm = createReferenceOnlyEntity(getAssemblingMachineEntity())
    const bp2 = Blueprint.of(asm)
    const conflicts = testBPs(emptyBlueprint, bp2)[0]
    assert.same([asm], conflicts.lostReferences)
    assert.same(["lostReferences"], Object.keys(conflicts), "no other conflicts")
  })

  it("updates other props to match", () => {
    // this largely relies on findEntityPasteConflictAndUpdate
    const updatedAssemblingMachine: ReferenceEntity = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
      recipe: "stone-furnace",
      changedProps: new LuaSet("recipe"), // name not considered
    }
    const blueprint2 = Blueprint.of(updatedAssemblingMachine)
    const conflicts = testBPs(singleAssemblerBlueprint, blueprint2)[0]
    assert.same({}, conflicts)

    assert.same(
      {
        ...getAssemblingMachineEntity(),
        // name: "assembling-machine-2",
        recipe: "stone-furnace",
        changedProps: new LuaSet("recipe"),
      },
      updatedAssemblingMachine,
    )
  })

  function assertConflictEquivalent(expected: BlueprintPasteConflicts, actual: BlueprintPasteConflicts): void {
    function normalizeEntity<T extends FullEntity>(this: unknown, entity: T): T {
      const result = mutableShallowCopy(entity)
      result.entity_number = 1
      delete result.connections
      return result
    }

    function normalizeConflict(this: unknown, conflict: EntityPair) {
      return {
        ...conflict,
        below: normalizeEntity(conflict.below),
        above: normalizeEntity(conflict.above),
      }
    }
    function normalize(conflict: BlueprintPasteConflicts): BlueprintPasteConflicts {
      return {
        overlaps: conflict.overlaps?.map(normalizeEntity),
        upgrades: conflict.upgrades?.map(normalizeConflict),
        itemRequestChanges: conflict.itemRequestChanges?.map(normalizeConflict),
        lostReferences: conflict.lostReferences?.map((x) => normalizeEntity(x)),
      }
    }
    expected = normalize(expected)
    actual = normalize(actual)
    assert.same(expected.overlaps, actual.overlaps, "overlaps")
    assert.same(expected.upgrades, actual.upgrades, "upgrades")
    assert.same(expected.itemRequestChanges, actual.itemRequestChanges, "itemRequestChanges")
    assert.same(expected.lostReferences, actual.lostReferences, "lostReferences")
  }

  interface ExpectedConflict {
    aboveEntity: string
    belowEntity: string
    type: "overlap" | "upgrade" | "items"
    prop?: string
  }

  const expectedConflicts: Record<BlueprintSampleName, ExpectedConflict | undefined> = {
    "add inserter": undefined,
    "add chest": undefined,
    "assembler rotate": undefined,
    "circuit wire add": undefined,
    "circuit wire remove": undefined,
    "control behavior change": undefined,
    "delete splitter": undefined,
    "inserter fast replace": {
      aboveEntity: "fast-inserter",
      belowEntity: "inserter",
      type: "upgrade",
    },
    "inserter rotate": {
      aboveEntity: "inserter",
      belowEntity: "inserter",
      type: "overlap",
    },
    "mixed change": {
      aboveEntity: "inserter",
      belowEntity: "inserter",
      type: "overlap",
    },
    "module change": {
      aboveEntity: "assembling-machine-2",
      belowEntity: "assembling-machine-2",
      type: "items",
    },
    "module purple sci": {
      aboveEntity: "assembling-machine-2",
      belowEntity: "assembling-machine-2",
      type: "items",
    },
    "move splitter": undefined,
    "recipe change": undefined,
    "recipe change 2": undefined,
    "splitter flip": {
      aboveEntity: "splitter",
      belowEntity: "splitter",
      type: "overlap",
    },
    "stack size change": undefined,
    original: undefined,
    "pole circuit add": undefined,
  }

  test.each(BlueprintSampleNames, "conflicts match expected for sample: %s", (sampleName) => {
    // test("diagnostics match expected for changing to sample: module change", () => {
    //   const sampleName: BlueprintSampleName = "inserter fast replace"

    const below = Blueprint.fromArray(getBlueprintSample("original"))
    const above = Blueprint.fromArray(getBlueprintSample(sampleName))

    const conflicts = testBPs(below, above)[0]

    const expected = expectedConflicts[sampleName]
    if (!expected) {
      assert.same({}, conflicts)
      return
    }
    const aboveEntity = above.asArray().find((x) => x.name === expected.aboveEntity)!
    const belowEntity = below.asArray().find((x) => x.name === expected.belowEntity)!
    let expectedConflict: BlueprintPasteConflicts
    if (expected.type === "overlap") {
      expectedConflict = {
        overlaps: [aboveEntity],
      }
    } else if (expected.type === "upgrade") {
      expectedConflict = {
        upgrades: [{ below: belowEntity, above: aboveEntity }],
      }
    } else if (expected.type === "items") {
      expectedConflict = {
        itemRequestChanges: [{ below: belowEntity, above: aboveEntity }],
      }
    } else {
      assertNever(expected.type)
    }
    assertConflictEquivalent(expectedConflict, conflicts)
  })
})
