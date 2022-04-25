import { Assembly } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint } from "../world-interaction/blueprint"
import { BlueprintSampleName, BlueprintSampleNames, getBlueprintSample } from "../test/blueprint-sample"
import { Blueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { pos } from "../lib/geometry/position"
import { invalidMockImport, mockImport } from "./import-mock"
import { BlueprintPasteConflicts, Overlap } from "../blueprint/blueprint-paste"
import { assertNever } from "../lib/util"
import { Entity, withEntityNumber } from "../entity/entity"
import { Mutable } from "../lib/util-types"
import { UserError } from "../player-interaction/protected-action"

let area: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: Blueprint

before_all(() => {
  const [surface1, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  surface = surface1
  area = bbox.normalize(area1)

  originalBlueprintSample = Blueprint.fromArray(getBlueprintSample("original"))
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
      assert.equal("test", assembly.getName())
      assert.equal(surface, assembly.surface)
      assert.same(area, assembly.area)
      assert.is_true(assembly.isValid())
    })

    it("rounds tiles", () => {
      const assembly = Assembly.create("test", surface, bbox.fromCorners(0.5, 0.5, 1.5, 1.5))
      assert.same(bbox.fromCorners(0, 0, 2, 2), assembly.area)
    })

    it("errors if intersects with existing assembly", () => {
      Assembly.create("test1", surface, area)
      const sp = spy<any>()
      rawset(rendering, "draw_rectangle", sp)
      after_test(() => rawset(rendering, "draw_rectangle", undefined!))
      const error = assert.error(() => Assembly.create("test2", surface, area))
      assert.truthy(error instanceof UserError)
      assert.message("highlighted").spy(sp).called()
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
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
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
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    assembly.refreshInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    assert.same({}, bp.entities)
  })
  test.each<BlueprintSampleName>(
    ["original", "module change", "module purple sci"],
    "refreshing an assembly with entities sets entities: %s",
    (sampleName) => {
      const sample = Blueprint.fromArray(getBlueprintSample(sampleName))
      pasteBlueprint(surface, area.left_top, sample.entities)
      const assembly = Assembly.create("test", surface, area)
      assembly.refreshInWorld()
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
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(0, 0))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = Blueprint.take(surface, area)
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  test("adding import to blueprint adds to in world at specified location", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(1, 1))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = Blueprint.take(surface, bbox.shift(area, pos(1, 1)))
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
    assembly.addImport(mockImport(Blueprint.fromArray(mockEntities)), pos(0, 0))
    assembly.refreshInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
    const expected = Blueprint.fromArray(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
    assertNoGhosts()
  })

  test("does not paste invalid import", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(invalidMockImport(), pos(0, 0))
    assembly.refreshInWorld()
    const bp = Blueprint.take(surface, area, area.left_top)
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
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const assembly = Assembly.create("test", surface, area)
    const bp = assembly.getLastResultContent()!
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
    assertNoGhosts()
  })
  it("returns contents of imports", () => {
    const assembly = Assembly.create("test", surface, area)
    const originalBlueprintSample = Blueprint.fromArray(getBlueprintSample("module change"))
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

describe("paste conflicts", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })

  it("has no conflicts for simple paste", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
    const assembly = Assembly.create("test", surface, area)
    assert.same([], assembly.getPasteConflicts())
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
    const assembly = Assembly.create("test", surface, area)
    const aboveBlueprint = Blueprint.fromArray(below)
    assembly.addImport(mockImport(aboveBlueprint), pos(0, 0))
    assembly.forceSaveChanges()
    assembly.refreshInWorld()

    const expected = expectedConflicts[sampleName]
    if (!expected) {
      assert.same({}, assembly.getPasteConflicts()[0])
      assert.same({}, assembly.getPasteConflicts()[1])
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
    assert.same([], assembly.getPasteConflicts()[0])
    assertConflictEquivalent(expectedConflict, assembly.getPasteConflicts()[1])
  })
})
describe("saveChanges", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  it("does not change anything if completely empty", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.forceSaveChanges()
    assert.same({}, Blueprint.take(surface, area, area.left_top).entities)
    assertNoGhosts()
  })

  it("sets ownContents", () => {
    const assembly = Assembly.create("test", surface, area)
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.entities)
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

describe("rendered objects", () => {
  test("bounding box", () => {
    const assembly = Assembly.create("test", surface, area)
    const ids = rendering.get_all_ids(script.mod_name)
    const id = ids.find((x) => {
      if (rendering.get_type(x) !== "rectangle") return false
      const lt = rendering.get_left_top(x)?.position
      const rb = rendering.get_right_bottom(x)?.position
      return lt && rb && pos.equals(lt, area.left_top) && pos.equals(rb, area.right_bottom)
    })!
    assert.not_nil(id, "no rectangle found")

    assembly.delete()
    assert.false(rendering.is_valid(id), "rectangle not deleted")
  })

  test("text", () => {
    const assembly = Assembly.create("test assembly", surface, area)
    const ids = rendering.get_all_ids(script.mod_name)
    const id = ids.find((x) => {
      if (rendering.get_type(x) !== "text") return false
      const text = rendering.get_text(x)
      const lt = rendering.get_target(x)?.position
      return lt && pos.equals(lt, area.left_top) && text === "test assembly"
    })!
    assert.not_nil(id, "no text found")

    assembly.delete()
    assert.false(rendering.is_valid(id), "text not deleted")
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
  assert.is_true(global.foo?.getName() === "reload test")
})
after_all(() => {
  delete global.foo
})
