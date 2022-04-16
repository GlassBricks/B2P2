import { Blueprint, MutableBlueprint } from "./Blueprint"
import { createEntity, Entity } from "../entity/entity"
import { getEntitySample } from "../test/entity-sample"
import { pos, PositionClass } from "../lib/geometry/position"
import {
  BlueprintDiff,
  BlueprintPasteConflicts,
  computeBlueprintDiff,
  findBlueprintPasteConflicts,
  findBlueprintPasteConflictsInWorld,
} from "./blueprint-paste"
import { getBlueprintSample } from "../test/blueprint-sample"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { ReferenceEntity } from "../entity/reference-entity"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"

let emptyBlueprint: Blueprint
let assemblingMachine: Entity
let singleAssemblerBlueprint: Blueprint
let noDiff: BlueprintDiff

before_all(() => {
  emptyBlueprint = new MutableBlueprint()
  assemblingMachine = createEntity({
    ...getEntitySample("assembling-machine-1"),
    position: pos(0.5, 0.5),
  })
  const saBlueprint = new MutableBlueprint()
  saBlueprint.addSingle(assemblingMachine)
  singleAssemblerBlueprint = saBlueprint
  noDiff = {
    content: emptyBlueprint,
    deletions: [],
  }
})
const noConflicts: BlueprintPasteConflicts = {
  overlaps: [],
  propConflicts: [],
}

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
    const movedAssemblingMachine = createEntity({
      ...assemblingMachine,
      position: pos(1.5, 1.5),
    })
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(movedAssemblingMachine)
    const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
    assert.same(
      [
        {
          below: assemblingMachine,
          above: movedAssemblingMachine,
        },
      ],
      conflicts.overlaps,
    )
    assert.same([], conflicts.propConflicts)
  })

  it("detects entity incompatibilities", () => {
    const asm2 = createEntity({
      ...assemblingMachine,
      name: "assembling-machine-2",
    })
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(asm2)
    const conflicts = findBlueprintPasteConflicts(singleAssemblerBlueprint, blueprint2)
    assert.same(
      [
        {
          below: assemblingMachine,
          above: asm2,
          prop: "name",
        },
      ],
      conflicts.propConflicts,
    )
    assert.same([], conflicts.overlaps)
  })
})

describe("findBlueprintPasteConflictsInWorld", () => {
  let surface: LuaSurface
  let area: BoundingBoxClass
  let pasteLocation: PositionClass
  before_all(() => {
    const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
    area = bbox.normalize(area1)
    surface = surface1
    clearBuildableEntities(surface, area)
    pasteLocation = pos.add(area.left_top, pos(2, 2))
    pasteBlueprint(surface, pasteLocation, singleAssemblerBlueprint.getAsArray(), area)
  })
  test("overlap", () => {
    const movedAssemblingMachine = createEntity({
      ...assemblingMachine,
      position: pos(3.5, 3.5),
    })
    const blueprint2 = new MutableBlueprint()
    blueprint2.addSingle(movedAssemblingMachine)
    const conflicts = findBlueprintPasteConflictsInWorld(surface, area, blueprint2, pasteLocation)
    assert.same(
      [
        {
          below: assemblingMachine,
          above: movedAssemblingMachine,
        },
      ],
      conflicts.overlaps,
    )
    assert.same([], conflicts.propConflicts)
  })
  test("no overlap", () => {
    const conflicts = findBlueprintPasteConflictsInWorld(surface, area, singleAssemblerBlueprint, pasteLocation)
    assert.same([], conflicts.overlaps)
    assert.same([], conflicts.propConflicts)
  })
})

function assertDiffsSame(expected: BlueprintDiff, actual: BlueprintDiff) {
  assert.same(expected.deletions, actual.deletions)
  assertBlueprintsEquivalent(expected.content, actual.content)
}

describe("getBlueprintDiffContent", () => {
  it("should return empty diff if no changes", () => {
    const blueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(blueprintSample, blueprintSample)
    assertDiffsSame(noDiff, diff)
  })

  it("should return exactly contents when compared to empty blueprint", () => {
    const blueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("original"))
    const diff = computeBlueprintDiff(emptyBlueprint, blueprintSample)
    assertDiffsSame(
      {
        content: blueprintSample,
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
        deletions: [assemblingMachine],
      },
      diff,
    )
  })

  it("should create update entities when compatible", () => {
    const asm1Bp = singleAssemblerBlueprint
    const asm2 = createEntity({
      ...assemblingMachine,
      name: "assembling-machine-2",
    })
    const asm2Bp = MutableBlueprint.fromPlainEntities([asm2])
    const diff = computeBlueprintDiff(asm1Bp, asm2Bp)
    const asm2Diff: ReferenceEntity = {
      ...asm2,
      changedProps: new LuaSet("name"),
      diffType: "reference",
    }
    assertDiffsSame(
      {
        content: MutableBlueprint.fromEntities([asm2Diff]),
        deletions: [],
      },
      diff,
    )
  })
})
