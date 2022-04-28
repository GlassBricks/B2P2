import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { Blueprint } from "../blueprint/Blueprint"
import { BlueprintSampleName, BlueprintSampleNames, getBlueprintSample } from "../test/blueprint-sample"
import { invalidMockImport, mockImport } from "./import-mock"
import { pos } from "../lib/geometry/position"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { BlueprintPasteConflicts, Overlap } from "../blueprint/blueprint-paste"
import { Entity, withEntityNumber } from "../entity/entity"
import { Mutable } from "../lib/util-types"
import { assertNever } from "../lib/util"
import { Classes } from "../lib"
import { AssemblyContent, DefaultAssemblyContent } from "./AssemblyContent"
import { get_area } from "__testorio__/testUtil/areas"

test("registered", () => {
  Classes.nameOf(DefaultAssemblyContent)
})

let area: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: Blueprint

before_all(() => {
  const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  surface = surface1
  area = bbox.normalize(area1)

  originalBlueprintSample = Blueprint.fromArray(getBlueprintSample("original"))
})

function createAssemblyContent(area1: BoundingBoxClass = area): AssemblyContent {
  return new DefaultAssemblyContent(surface, area1)
}

function assertNoGhosts() {
  const ghosts = surface.find_entities_filtered({ type: "ghost" })
  assert.same(
    {},
    ghosts.map((x) => ({ name: x.name, position: x.position })),
    "ghosts found",
  )
  const itemRequestProxies = surface.find_entities_filtered({ type: "item-request-proxy" })
  assert.same(
    {},
    itemRequestProxies.map((x) => ({ position: x.position })),
    "item-request-proxies found",
  )
}

describe("initializing contents", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("initializing in an empty area yields empty ownContents ", () => {
    const content = createAssemblyContent()
    assert.same({}, content.ownContents.entities)
  })

  test("initializing in an area with entities sets ownContents", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const content = createAssemblyContent()
    assertBlueprintsEquivalent(originalBlueprintSample, content.ownContents)
  })
})

describe("refreshInWorld", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("reset an empty assembly clears area", () => {
    const content = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    assert.same({}, bp.entities)
  })
  test.each<BlueprintSampleName>(
    ["original", "module change", "module purple sci"],
    "refreshing an assembly with entities sets entities: %s",
    (sampleName) => {
      const sample = Blueprint.fromArray(getBlueprintSample(sampleName))
      pasteBlueprint(surface, area.left_top, sample.entities)
      const content = createAssemblyContent()
      content.resetInWorld()
      const bp = Blueprint.take(surface, area, area.left_top)
      assertBlueprintsEquivalent(sample, bp)
      assertNoGhosts()
    },
  )
})

describe("import", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("adding import to blueprint adds to in world", () => {
    const content = createAssemblyContent()
    content.imports.push({
      content: mockImport(originalBlueprintSample),
      relativePosition: pos(0, 0),
    })
    assert.same({}, content.ownContents.entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, area)
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  test("adding import to blueprint adds to in world at specified location", () => {
    const content = createAssemblyContent()
    content.imports.push({
      content: mockImport(originalBlueprintSample),
      relativePosition: pos(1, 2),
    })
    assert.same({}, content.ownContents.entities)
    content.resetInWorld()
    const bp = Blueprint.take(surface, bbox.shift(area, pos(1, 2)))
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  test("imported entities do not extend beyond bounding box", () => {
    const mockEntities: BlueprintEntityRead[] = [
      {
        name: "iron-chest",
        position: pos(0.5, 0.5),
        entity_number: 1,
      },
      {
        name: "steel-chest",
        position: pos(10.5, 10.5),
        entity_number: 2,
      },
    ]
    const content = createAssemblyContent(bbox(area.left_top, pos.add(area.left_top, pos(5, 5))))
    content.imports.push({
      content: mockImport(Blueprint.fromArray(mockEntities)),
      relativePosition: pos(0, 0),
    })
    content.resetInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    const expected = Blueprint.fromArray(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
    assertNoGhosts()
  })

  test("does not paste invalid import", () => {
    const content = createAssemblyContent()
    content.imports.push({
      content: invalidMockImport(),
      relativePosition: pos(0, 0),
    })
    const bp = Blueprint.take(surface, area, area.left_top)
    assert.same({}, bp.entities)
  })
})

describe("paste conflicts", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("has no conflicts for simple paste", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const content = createAssemblyContent()
    assert.same([{}], content.lastPasteConflicts.get())
  })

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
  function assertConflictEquivalent(expected: BlueprintPasteConflicts, actual: BlueprintPasteConflicts): void {
    function normalizeEntity(entity: Entity) {
      const result = withEntityNumber(entity, 1) as Mutable<Entity>
      delete result.connections
      return result
    }

    function normalizeConflict(this: unknown, overlap: Overlap) {
      return {
        ...overlap,
        below: normalizeEntity(overlap.below),
        above: normalizeEntity(overlap.above),
      }
    }
    function normalize(conflict: BlueprintPasteConflicts) {
      return {
        overlaps: conflict.overlaps?.map(normalizeConflict),
        propConflicts: conflict.propConflicts?.map(normalizeConflict),
        lostReferences: conflict.lostReferences?.map((x) => withEntityNumber(x, 1)),
      } as BlueprintPasteConflicts
    }
    expected = normalize(expected)
    actual = normalize(actual)
    assert.same(expected.overlaps, actual.overlaps, "overlaps")
    assert.same(expected.propConflicts, actual.propConflicts, "propConflicts")
    assert.same(expected.lostReferences, actual.lostReferences, "lostReferences")
  }

  test.each(BlueprintSampleNames, "conflicts match expected for sample: %s", (sampleName) => {
    // test("diagnostics match expected for changing to sample: module change", () => {
    //   const sampleName: BlueprintSampleName = "inserter fast replace"

    const below = getBlueprintSample("original")
    const above = getBlueprintSample(sampleName)

    pasteBlueprint(surface, area.left_top, above)
    const contents = createAssemblyContent()
    const aboveBlueprint = Blueprint.fromArray(below)
    // assembly.addImport(mockImport(aboveBlueprint), pos(0, 0))
    contents.imports.push({ content: mockImport(aboveBlueprint), relativePosition: pos(0, 0) })
    contents.prepareSave()
    contents.commitSave()
    contents.resetInWorld()

    const expected = expectedConflicts[sampleName]
    if (!expected) {
      assert.same({}, contents.lastPasteConflicts.get()[0])
      assert.same({}, contents.lastPasteConflicts.get()[1])
      return
    }
    const aboveEntity = above.find((x) => x.name === expected.aboveEntity)!
    const belowEntity = below.find((x) => x.name === expected.belowEntity)!
    let expectedConflict: BlueprintPasteConflicts
    if (expected.type === "overlap") {
      expectedConflict = {
        overlaps: [{ below: belowEntity, above: aboveEntity }],
      }
    } else if (expected.type === "upgrade") {
      expectedConflict = {
        propConflicts: [{ below: belowEntity, above: aboveEntity, prop: "name" }],
      }
    } else if (expected.type === "items") {
      expectedConflict = {
        propConflicts: [{ below: belowEntity, above: aboveEntity, prop: "items" }],
      }
    } else {
      assertNever(expected.type)
    }
    assert.same([], contents.lastPasteConflicts.get()[0])
    assertConflictEquivalent(expectedConflict, contents.lastPasteConflicts.get()[1])
  })
})
describe("saveChanges", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  it("does not change anything if completely empty", () => {
    const contents = createAssemblyContent()
    contents.prepareSave()
    contents.commitSave()
    assert.same({}, Blueprint.take(surface, area, area.left_top).entities)
    assertNoGhosts()
  })

  it("sets ownContents", () => {
    const contents = createAssemblyContent()
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    contents.prepareSave()
    contents.commitSave()
    assertBlueprintsEquivalent(originalBlueprintSample, contents.ownContents)
    assertNoGhosts()
  })

  it("is empty when content exactly matches imports", () => {
    const contents = createAssemblyContent()
    contents.imports.push({ content: mockImport(originalBlueprintSample), relativePosition: pos(0, 0) })
    contents.resetInWorld()
    contents.prepareSave()
    contents.commitSave()
    assert.same({}, contents.ownContents.entities)
    assertNoGhosts()
  })
})
