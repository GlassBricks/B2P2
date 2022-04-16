import { Assembly, CannotUpgrade, ItemsIgnored, Overlap, PasteDiagnostics } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { BlueprintSampleName, BlueprintSampleNames, getBlueprintSample } from "../test/blueprint-sample"
import { Blueprint, getBlueprintFromWorld, MutableBlueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { pos } from "../lib/geometry/position"
import { invalidMockImport, mockImport } from "./import-mock"
import { Diagnostic } from "../diagnostics/Diagnostic"

let area: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: Blueprint

before_all(() => {
  const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  surface = surface1
  area = bbox.normalize(area1)

  originalBlueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("original"))
})
after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

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

describe("lifecycle", () => {
  describe("create", () => {
    it("matches given parameters", () => {
      const assembly = Assembly.create("test", surface, area)
      assert.equal("test", assembly.name)
      assert.equal(surface, assembly.surface)
      assert.equal(area, assembly.area)
      assert.is_true(assembly.isValid())
    })

    it("errors if intersects with existing assembly", () => {
      Assembly.create("test1", surface, area)
      assert.error(() => Assembly.create("test2", surface, area))
    })

    it("shows up in getAllAssemblies", () => {
      const assembly = Assembly.create("test", surface, area)
      assert.is_true(Assembly.getAllAssemblies().has(assembly))
    })
  })

  test("becomes invalid when surface deleted", () => {
    const surface = game.create_surface("test")
    const assembly = Assembly.create("test", surface, area)
    game.delete_surface(surface)
    async(2)
    on_tick(() => {
      if (!assembly.isValid()) {
        done()
      }
    })
  })

  test("delete makes assembly invalid", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.delete()
    assert.is_false(assembly.isValid())
  })
})

describe("initializing contents", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("initializing in an empty area yields empty ownContents ", () => {
    const assembly = Assembly.create("test", surface, area)
    assert.same({}, assembly.ownContents.entities)
  })

  test("initializing in an area with entities sets ownContents", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    const assembly = Assembly.create("test", surface, area)
    assertBlueprintsEquivalent(originalBlueprintSample, assembly.ownContents)
  })
})

describe("refreshInWorld", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("refreshing an empty assembly clears area", () => {
    const assembly = Assembly.create("test", surface, area)
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    assembly.refreshInWorld()
    const bp = getBlueprintFromWorld(surface, area)
    assert.same({}, bp.entities)
  })
  test.each<BlueprintSampleName>(
    ["original", "module change", "module purple sci"],
    "refreshing an assembly with entities sets entities: %s",
    (sampleName) => {
      const sample = MutableBlueprint.fromPlainEntities(getBlueprintSample(sampleName))
      pasteBlueprint(surface, area.left_top, sample.getAsArray())
      const assembly = Assembly.create("test", surface, area)
      assembly.refreshInWorld()
      const bp = getBlueprintFromWorld(surface, area)
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
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(0, 0))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = getBlueprintFromWorld(surface, area)
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  test("adding import to blueprint adds to in world at specified location", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(1, 1))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = getBlueprintFromWorld(surface, bbox.shift(area, pos(1, 1)))
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
    const assembly = Assembly.create("test", surface, bbox(area.left_top, pos.add(area.left_top, pos(5, 5))))
    assembly.addImport(mockImport(MutableBlueprint.fromPlainEntities(mockEntities)), pos(0, 0))
    assembly.refreshInWorld()
    const bp = getBlueprintFromWorld(surface, area)
    const expected = MutableBlueprint.fromPlainEntities(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
    assertNoGhosts()
  })

  test("does not paste invalid import", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(invalidMockImport(), pos(0, 0))
    assembly.refreshInWorld()
    const bp = getBlueprintFromWorld(surface, area)
    assert.same({}, bp.entities)
  })
})

describe("getLastResultContent", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  it("returns empty blueprint when empty", () => {
    const assembly = Assembly.create("test", surface, area)
    const bp = assembly.getLastResultContent()!
    assert.same({}, bp.entities)
  })
  it("returns contents when initialized with contents", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    const assembly = Assembly.create("test", surface, area)
    const bp = assembly.getLastResultContent()!
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  it("returns contents of imports", () => {
    const assembly = Assembly.create("test", surface, area)
    const originalBlueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("module change"))
    assembly.addImport(mockImport(originalBlueprintSample), pos(0, 0))
    assembly.refreshInWorld() // refresh to get the import in the world
    const bp = assembly.getLastResultContent()!
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  it("returns undefined if invalid", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.delete()
    assert.is_nil(assembly.getLastResultContent())
  })
})

describe("paste diagnostics", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("has no diagnostics for simple paste", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    const assembly = Assembly.create("test", surface, area)
    assert.same([], assembly.getPasteDiagnostics())
  })

  interface ExpectedConflict {
    aboveEntity: string
    belowEntity: string
    type: "overlap" | "upgrade" | "items"
    prop?: string
  }

  const expectedConflicts: Record<BlueprintSampleName, ExpectedConflict | undefined> = {
    "add inserter": undefined,
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
  }

  test.each(BlueprintSampleNames, "diagnostics match expected for changing to sample: %s", (sampleName) => {
    // test("diagnostics match expected for changing to sample: module change", () => {
    //   const sampleName: BlueprintSampleName = "inserter fast replace"

    const below = getBlueprintSample("original")
    const above = getBlueprintSample(sampleName)

    pasteBlueprint(surface, area.left_top, above)
    const assembly = Assembly.create("test", surface, area)
    const aboveBlueprint = MutableBlueprint.fromPlainEntities(below)
    assembly.addImport(mockImport(aboveBlueprint), pos(0, 0))
    assembly.forceSaveChanges()
    assembly.refreshInWorld()

    const expected = expectedConflicts[sampleName]
    if (!expected) {
      assert.same([], assembly.getPasteDiagnostics()[0])
      assert.same([], assembly.getPasteDiagnostics()[1])
      return
    }
    const aboveEntity = above.find((x) => x.name === expected.aboveEntity)!
    const belowEntity = below.find((x) => x.name === expected.belowEntity)!
    let expectedDiagnostic: Diagnostic<PasteDiagnostics>
    if (expected.type === "overlap") {
      expectedDiagnostic = Overlap(belowEntity, aboveEntity)
    } else if (expected.type === "upgrade") {
      expectedDiagnostic = CannotUpgrade(belowEntity, aboveEntity)
    } else if (expected.type === "items") {
      expectedDiagnostic = ItemsIgnored(aboveEntity)
    } else {
      error("unexpected type")
    }
    assert.same([], assembly.getPasteDiagnostics()[0])
    assert.same([expectedDiagnostic], assembly.getPasteDiagnostics()[1])
  })
})

describe("saveChanges", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  it("does not change anything if completely empty", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.forceSaveChanges()
    assert.same({}, getBlueprintFromWorld(surface, area).entities)
    assertNoGhosts()
  })

  it("sets ownContents", () => {
    const assembly = Assembly.create("test", surface, area)
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    assembly.forceSaveChanges()
    assertBlueprintsEquivalent(originalBlueprintSample, assembly.ownContents)
    assertNoGhosts()
  })

  it("is empty when content exactly matches imports", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(0, 0))
    assembly.refreshInWorld()
    assembly.forceSaveChanges()
    assert.same({}, assembly.ownContents.entities)
    assertNoGhosts()
  })
})

declare const global: {
  foo?: Assembly
}
test("Assembly persists across game reload", () => {
  global.foo = Assembly.create("reload test", surface, area)
}).after_mod_reload(() => {
  assert.is_true(global.foo instanceof Assembly)
  assert.is_true(global.foo?.isValid())
  assert.is_true(global.foo?.name === "reload test")
})
after_all(() => {
  delete global.foo
})
