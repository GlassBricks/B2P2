import {
  BasicBlueprint,
  BlueprintPaste,
  filterBlueprint,
  MutableBasicBlueprint,
  MutableBlueprint,
} from "../entity/Blueprint"
import { compareBlueprints } from "../entity/blueprint-diff"
import { clearArea, pasteBlueprint, takeBlueprint } from "../world/blueprint"
import { DataLayer } from "./DataLayer"
import { layerAdd } from "./layer-add"
import { Diagnostic } from "../utility/diagnostic"
import { L_Diagnostic } from "../locale"

const samples = [
  "original",
  "add",
  "delete",
  "move",
  "mixed",
  "rotate",
  "pasteable rotate",
  "reconfig",
  "advanced reconfig",
  "fast replace",
  "module change",
  "behavior change",
  "stack size change",
  "circuit add",
  "circuit delete",
  "flip",
] as const
type SampleName = typeof samples[number]

interface ExpectedDiff {
  additions?: number
  deletions?: number
  updates?: number

  pasteable?: boolean
}
const expected: Record<SampleName, ExpectedDiff> = {
  original: {
    additions: 0,
    deletions: 0,
    updates: 0,
    pasteable: true,
  },
  add: {
    additions: 1,
    deletions: 0,
    updates: 0,
    pasteable: true,
  },
  delete: {
    additions: 0,
    deletions: 1,
    updates: 0,
    pasteable: true,
  },
  move: {
    additions: 1,
    deletions: 1,
    updates: 0,
    pasteable: true,
  },
  mixed: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  rotate: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  "pasteable rotate": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  reconfig: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "advanced reconfig": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "fast replace": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  "module change": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  "behavior change": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "stack size change": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "circuit add": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "circuit delete": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  flip: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
}

// const circuitSamples = samples.filter((sample) => sample.includes("circuit"))
const nonCircuitSamples = samples.filter((sample) => !sample.includes("circuit"))

describe("samples", () => {
  let surface: LuaSurface
  let original: BasicBlueprint
  let workingArea: BoundingBoxRead

  function getSample(name: SampleName): BasicBlueprint {
    const area = surface.get_script_area(name) ?? error(`could not find area '${name}'`)
    const bp = takeBlueprint(surface, area.area)
    return MutableBlueprint.fromEntities(bp).shiftToOrigin()
  }

  before_all(() => {
    surface = game.get_surface(1 as SurfaceIndex)!
    workingArea = surface.get_script_area("working area")?.area ?? error("could not find area 'working area'")
    original = getSample("original")
  })

  test.each(nonCircuitSamples, "diff is correct: %s", (name) => {
    if (name.includes("circuit")) return

    const assembly = getSample(name)
    const diff = compareBlueprints(original, assembly)
    const expectedDiff = expected[name]

    const resultEntities = diff.asArray()

    const additions = resultEntities.filter((x) => x.diffType === undefined).length
    const updates = resultEntities.filter((x) => x.diffType === "update").length
    const deletions = resultEntities.filter((x) => x.diffType === "delete").length

    assert.equal(expectedDiff.additions, additions, "additions")
    assert.equal(expectedDiff.updates, updates, "updates")
    assert.equal(expectedDiff.deletions, deletions, "deletions")
  })
  test.todo("diff is correct: circuit network")

  test.each(samples, "data layer add matches blueprint behavior: %s", (name) => {
    // const name = "rotate"
    // test.only(`data layer add matches blueprint behavior: ${name}`, () => {
    //   if (name.includes("circuit")) return
    const sample = getSample(name)

    function testLayerAdd(
      below: BasicBlueprint,
      above: BlueprintPaste,
      pasteable: boolean,
    ): {
      blueprint: BasicBlueprint
      diagnostics: Diagnostic[]
      pastedEntities: LuaEntity[]
    } {
      const belowLayer = new DataLayer("below", below)
      const aboveLayer = new DataLayer("above", above)
      const state = new MutableBasicBlueprint()

      const surfaceIndex = 1 as SurfaceIndex
      clearArea(surfaceIndex, workingArea)

      // paste below
      const diagnostics1 = layerAdd(state, belowLayer)
      assert.same([], diagnostics1, "adding from empty should not produce diagnostics")

      const entities = pasteBlueprint(surfaceIndex, workingArea.left_top, below.asArray())
      assert.same(entities.length, below.asArray().length, "should paste all entities")

      // paste above
      const diagnostics2 = layerAdd(state, aboveLayer) // there might be diagnostics, but ignore for now
      const entities2 = pasteBlueprint(surfaceIndex, workingArea.left_top, above.asArray())

      const overlaps = diagnostics2.filter((x) => x.id === L_Diagnostic.Overlap)
      const matches = diagnostics2.filter((x) => x.id === L_Diagnostic.AddEntityOverAddEntity)
      const unpasteable = diagnostics2.filter((x) => x.id === L_Diagnostic.UnpasteableEntity)
      if (pasteable) {
        assert.equal(0, overlaps.length, "should not overlap if pasteable")
        assert.equal(0, unpasteable.length, "should not have unpasteable if pasteable")

        const updateEntities = above.asArray().filter((x) => x.diffType === "update")

        const expectedPasted = above.asArray().length - matches.length - updateEntities.length
        assert.equal(expectedPasted, entities2.length, "should paste all entities")
      }

      // compare world and result
      const world = MutableBlueprint.fromEntities(takeBlueprint(surface, workingArea))
      const diff = compareBlueprints(world, state)
      const resultEntities = diff.asArray()
      const addedDiff = resultEntities.filter((x) => x.diffType === undefined)
      assert.equal(addedDiff.length, overlaps.length, "overlaps should equal what was not pasted")
      const updateDiff = resultEntities.filter((x) => x.diffType === "update")
      if (pasteable) {
        assert.equal(0, updateDiff.length, "should not have updates if pasteable")
      }

      return {
        blueprint: state,
        diagnostics: diagnostics2,
        pastedEntities: entities2,
      }
    }

    const expectedDiff = expected[name]
    testLayerAdd(original, sample, expectedDiff.pasteable || false)

    const sampleDiff = compareBlueprints(original, sample)
    testLayerAdd(
      original,
      filterBlueprint(sampleDiff, (x) => x.diffType !== "delete") as BlueprintPaste,
      expectedDiff.pasteable || false,
    )
  })

  // after_all(() => {
  //   clearArea(workingArea)
  // })
})
