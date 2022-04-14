import { Assembly } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint, takeBlueprint } from "../world-interaction/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { Blueprint, MutableBlueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { pos } from "../lib/geometry/position"
import { mockImport } from "./import-mock"

let area: BoundingBoxClass
let area2: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: Blueprint

before_all(() => {
  let [, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  area = bbox.normalize(area1)
  ;[surface, area1] = get_area(1 as SurfaceIdentification, "working area 2")
  area2 = bbox.normalize(area1)

  originalBlueprintSample = MutableBlueprint.fromPlainEntities(getBlueprintSample("original"))
})
after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

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
  })
  test("refreshing an assembly with entities sets entities", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    const assembly = Assembly.create("test", surface, area)
    assembly.refreshInWorld()
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    assertBlueprintsEquivalent(bp, assembly.ownContents)
  })
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
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
  })
  test("adding import to blueprint adds to in world at specified location", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(1, 1))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, bbox.shift(area, pos(1, 1))))
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
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
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    const expected = MutableBlueprint.fromPlainEntities(mockEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
  })
})
describe("getResultContent", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("resultContents returns empty blueprint when empty", () => {
    const assembly = Assembly.create("test", surface, area)
    const bp = assembly.getLastResultContent()
    assert.same({}, bp.entities)
  })
  test("resultContents returns contents when initialized with contents", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample.getAsArray())
    const assembly = Assembly.create("test", surface, area)
    const bp = assembly.getLastResultContent()
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
  })
  test("resultContents returns contents of imports", () => {
    const assembly = Assembly.create("test", surface, area)
    assembly.addImport(mockImport(originalBlueprintSample), pos(0, 0))
    assembly.refreshInWorld() // refresh to get the import in the world
    const bp = assembly.getLastResultContent()
    assertBlueprintsEquivalent(originalBlueprintSample, bp)
  })
})

declare const global: {
  foo?: Assembly
}
test("persists across game reload", () => {
  global.foo = Assembly.create("reload test", surface, area)
}).after_mod_reload(() => {
  assert.is_true(global.foo instanceof Assembly)
  assert.is_true(global.foo?.isValid())
  assert.is_true(global.foo?.name === "reload test")
})
after_all(() => {
  delete global.foo
})
