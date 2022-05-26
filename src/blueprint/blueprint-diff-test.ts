import { FullEntity, PasteEntity, ReferenceEntity } from "../entity/entity"
import { pos } from "../lib/geometry"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { getEntitySample } from "../test/entity-sample"
import { Blueprint } from "./Blueprint"
import { BlueprintDiff, computeBlueprintDiff } from "./blueprint-diff"
import { LuaBlueprint } from "./LuaBlueprint"

let noDiff: BlueprintDiff
let emptyBlueprint: Blueprint<FullEntity>
let singleAssemblerBlueprint: Blueprint<FullEntity>

function getAssemblingMachineEntity(): FullEntity {
  return {
    ...getEntitySample("assembling-machine-1"),
    position: pos(3.5, 3.5),
  }
}
before_all(() => {
  emptyBlueprint = LuaBlueprint.of()
  singleAssemblerBlueprint = LuaBlueprint.of(getAssemblingMachineEntity())
  noDiff = {
    content: emptyBlueprint,
  }
})

function assertDiffsSame(expected: BlueprintDiff, actual: BlueprintDiff) {
  assert.same(expected.deletions, actual.deletions, "deletions")
  assertBlueprintsEquivalent(expected.content, actual.content)
}

describe("computeBlueprintDiff", () => {
  it("should return empty diff if no changes", () => {
    const blueprintSample = getBlueprintSample("original")
    const diff = computeBlueprintDiff(blueprintSample, blueprintSample)
    assertDiffsSame(noDiff, diff)
  })

  it("should return exactly contents when compared to empty blueprint", () => {
    const blueprintSample = getBlueprintSample("original")
    const diff = computeBlueprintDiff(emptyBlueprint, blueprintSample)
    assertDiffsSame(
      {
        content: blueprintSample,
      },
      diff,
    )
  })

  it("should only include changed entities", () => {
    const original = getBlueprintSample("original")
    const added = getBlueprintSample("add chest")
    const diff = computeBlueprintDiff(original, added)
    const expectedDiff = LuaBlueprint.of(added.getEntities().find((x) => x.name === "iron-chest")!)
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
    const asm2Bp = LuaBlueprint.of(asm2)
    const diff = computeBlueprintDiff(asm1Bp, asm2Bp)
    const asm2Diff: ReferenceEntity = {
      ...asm2,
      changedProps: new LuaSet("name"),
    }
    const expectedContent = LuaBlueprint.of(asm2Diff)
    assertDiffsSame(
      {
        content: expectedContent,
      },
      diff,
    )
  })

  describe("circuit connections", () => {
    it("should create an reference entity when connected to new entity", () => {
      const original = getBlueprintSample("original")
      const added = getBlueprintSample("pole circuit add")
      const diff = computeBlueprintDiff(original, added).content.getEntities()
      assert.equal(2, diff.length)
      const inserter = diff.find((x) => x.name === "inserter")!
      assert.same(new LuaSet("connections"), inserter.changedProps)
      const pole = diff.find((x) => x.name === "small-electric-pole")!
      assert.not_nil(pole)
      assert.is_nil(pole.changedProps)
    })

    it("should create reference entities for new connection to existing entities", () => {
      const original = getBlueprintSample("original")
      const added = getBlueprintSample("circuit wire add")
      const diff = computeBlueprintDiff(original, added).content.getEntities()
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
