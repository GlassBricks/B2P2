import { BasicBlueprint, MutableEntityGrid } from "./EntityGrid"
import { getBlueprintEntities } from "../test-util/blueprint"
import { compareBlueprints } from "./blueprint-diff"

const samples = [
  "original",
  "addition",
  "deletion",
  "move",
  "rotation",
  "advanced rotation",
  "reconfiguration",
  "advanced reconfiguration",
  "fast replace",
  "module change",
  "behavior change",
  "circuit disconnect",
  "circuit connect",
  "unpasteable flip",
  "mixed change",
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
  addition: {
    additions: 1,
    deletions: 0,
    updates: 0,
    pasteable: true,
  },
  deletion: {
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
  rotation: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  "advanced rotation": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  reconfiguration: {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "advanced reconfiguration": {
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
  "circuit disconnect": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "circuit connect": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: true,
  },
  "unpasteable flip": {
    additions: 0,
    deletions: 0,
    updates: 1,
    pasteable: false,
  },
  "mixed change": {
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
  // let workingArea: BoundingBoxRead

  function getSample(name: SampleName): BasicBlueprint {
    const newName = `sample ${name}`
    const area = surface.get_script_area(newName) ?? error(`could not find area '${newName}'`)
    const bp = getBlueprintEntities(area.area, surface)
    return MutableEntityGrid.fromBlueprint(bp).shiftToOrigin()
  }

  before_all(() => {
    surface = game.get_surface(1)!
    // workingArea = surface.get_script_area("working area")?.area ?? error("could not find area 'working area'")
    original = getSample("original")
  })

  test.each(nonCircuitSamples, "diff is correct: %s", (name) => {
    if (name.includes("circuit")) return

    const assembly = getSample(name)
    const diff = compareBlueprints(original, assembly)
    const expectedDiff = expected[name]

    const resultEntities = diff.asArray()

    const additions = resultEntities.filter((x) => x.entityType === undefined).length
    const updates = resultEntities.filter((x) => x.entityType === "update").length
    const deletions = resultEntities.filter((x) => x.entityType === "delete").length

    assert.equal(expectedDiff.additions, additions, "additions")
    assert.equal(expectedDiff.updates, updates, "updates")
    assert.equal(expectedDiff.deletions, deletions, "deletions")
  })
  test.todo("diff is correct: circuit network")

  //
  // test.each(samples, "pasteAssembly matches blueprint behavior: %s", (name) => {
  //   // test("paste matches expected", () => {
  //   //   const name = "advanced rotation"
  //
  //   const sample = getSample(name)
  //
  //   // simulate pasting
  //   const { assembly: resultAssembly, overlaps, unpasteableUpdates } = pasteAssembly(original, sample)
  //
  //   clearArea(workingArea)
  //   // paste original, then sample
  //   const blueprintEntities = original.getBlueprintEntities()
  //
  //   const { neededForceBuild } = tryPasteBlueprint({
  //     position: workingArea.left_top,
  //     entities: blueprintEntities,
  //   })
  //   assert.is_false(neededForceBuild, "original paste should not need force build")
  //
  //   const { neededForceBuild: neededForceBuild2 } = tryPasteBlueprint({
  //     position: workingArea.left_top,
  //     entities: sample.getBlueprintEntities(),
  //   })
  //
  //   const hasOverlaps = overlaps.length > 0
  //   assert.equal(neededForceBuild2, hasOverlaps, "has overlaps matches neededForceBuild")
  //
  //   const wasPasteable = unpasteableUpdates.length === 0 && !hasOverlaps
  //   assert.equal(expected[name].pasteable, wasPasteable, "pasteable")
  //
  //   // get blueprint of result and compare to resultAssembly
  //   const entities3 = getBlueprintEntities(workingArea)
  //   const worldResult = MutableEntityGrid.fromBlueprint(entities3).shiftToOrigin()
  //   const worldDiff = compareAssemblies(worldResult, resultAssembly)
  //   assert.same([], worldDiff.additions, "world diff additions")
  //   assert.same([], worldDiff.deletions, "world diff deletions")
  //   assert.same([], worldDiff.changes, "world diff changes")
  // })

  // after_all(() => {
  //   clearArea(workingArea)
  // })
})
