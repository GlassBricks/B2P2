import { FullEntity, ReferenceEntity } from "../entity/entity"
import { createReferenceOnlyEntity } from "../entity/entity-paste"
import { assertNever, mutableShallowCopy } from "../lib"
import { bbox, BoundingBoxClass, pos, Position } from "../lib/geometry"
import { BlueprintSampleName, BlueprintSampleNames, getBlueprintSample } from "../test/blueprint-sample"
import { getEntitySample } from "../test/entity-sample"
import { getWorkingArea1 } from "../test/misc"
import { Blueprint, createEntityMap } from "./Blueprint"
import {
  BlueprintPasteConflicts,
  BlueprintPasteOptions,
  EntityPair,
  findCompatibleEntity,
  pasteAndFindConflicts,
} from "./blueprint-paste"
import { LuaBlueprint, PasteBlueprint } from "./LuaBlueprint"
import { clearBuildableEntities, pasteBlueprint } from "./world"

let emptyBlueprint: Blueprint<FullEntity>
function getAssemblingMachineEntity(): FullEntity {
  return {
    ...getEntitySample("assembling-machine-1"),
    position: pos(3.5, 3.5),
  }
}
let singleAssemblerBlueprint: Blueprint<FullEntity>

before_all(() => {
  emptyBlueprint = LuaBlueprint.of()
  singleAssemblerBlueprint = LuaBlueprint.of(getAssemblingMachineEntity())
})

describe("findCompatibleEntity", () => {
  it("Finds compatible entity", () => {
    const rawEntity = getEntitySample("assembling-machine-1")
    const rawEntity2 = {
      ...getEntitySample("assembling-machine-2"),
      position: rawEntity.position,
    }
    const map = createEntityMap([rawEntity])
    const result = findCompatibleEntity(map, rawEntity2)
    assert.equal(rawEntity, result)
  })

  it("returns undefined if no compatible entity is found", () => {
    const rawEntity1 = getEntitySample("assembling-machine-1")
    const rawEntity2 = getEntitySample("chest")
    const map = createEntityMap([rawEntity1])
    const result = findCompatibleEntity(map, rawEntity2)
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
  function testBPs(
    below: Blueprint<FullEntity>,
    above: PasteBlueprint,
    pasteLocation: Position = area.left_top,
    options: BlueprintPasteOptions = {},
  ) {
    pasteBlueprint(surface, pasteLocation, below)
    const pasteArea = bbox.shiftToOrigin(area).shift(pasteLocation)
    return pasteAndFindConflicts(surface, area, above, pasteArea, options)
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
    const blueprint2 = LuaBlueprint.of(movedAssemblingMachine)
    const conflicts = testBPs(singleAssemblerBlueprint, blueprint2)[0]
    assert.same([movedAssemblingMachine], conflicts.overlaps)
    assert.same(["overlaps"], Object.keys(conflicts), "no other conflicts")
  })

  it("detects entity incompatibilities", () => {
    const asm2 = {
      ...getAssemblingMachineEntity(),
      name: "assembling-machine-2",
    }
    const blueprint2 = LuaBlueprint.of(asm2)
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
    const bp2 = LuaBlueprint.of(asm)
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
    const blueprint2 = LuaBlueprint.of(updatedAssemblingMachine)
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
    "inserter fast replace and control change": {
      type: "upgrade",
      aboveEntity: "fast-inserter",
      belowEntity: "inserter",
    },
  }

  test.each(BlueprintSampleNames, "conflicts match expected for sample: %s", (sampleName) => {
    // test("diagnostics match expected for changing to sample: module change", () => {
    //   const sampleName: BlueprintSampleName = "inserter fast replace"

    const below = getBlueprintSample("original")
    const above = getBlueprintSample(sampleName)

    const conflicts = testBPs(below, above)[0]

    const expected = expectedConflicts[sampleName]
    if (!expected) {
      assert.same({}, conflicts)
      return
    }
    const aboveEntity = above.getEntities().find((x) => x.name === expected.aboveEntity)!
    const belowEntity = below.getEntities().find((x) => x.name === expected.belowEntity)!
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

  test("can upgrade entities", () => {
    const below = getBlueprintSample("original")
    const above = getBlueprintSample("inserter fast replace and control change")

    const pasteLocation: Position = area.left_top
    pasteBlueprint(surface, pasteLocation, below)
    const inserter = surface.find_entities_filtered({ name: "inserter", area })[0]
    assert.not_nil(inserter, "inserter below")
    const oldControl = (inserter.get_control_behavior() as LuaInserterControlBehavior).circuit_read_hand_contents
    pasteAndFindConflicts(surface, area, above, area, { allowUpgrades: true })
    const fastInserter = surface.find_entities_filtered({ name: "fast-inserter", area })[0]
    assert.not_nil(fastInserter, "inserter was upgraded")
    assert.false(inserter.valid, "old inserter replaced")
    const newControl = (fastInserter.get_control_behavior() as LuaInserterControlBehavior).circuit_read_hand_contents
    assert.not_equal(oldControl, newControl, "control behavior changed")
  })
})
