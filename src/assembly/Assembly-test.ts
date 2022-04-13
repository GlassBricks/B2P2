import { Assembly } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearBuildableEntities, pasteBlueprint, takeBlueprint } from "../world-interaction/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { MutableBlueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"
import { ImportContent } from "./Import"
import { pos } from "../lib/geometry/position"

let area: BoundingBoxClass
let area2: BoundingBoxClass
let surface: LuaSurface

let originalBlueprintSample: BlueprintEntityRead[]

before_all(() => {
  let [, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  area = bbox.normalize(area1)
  ;[surface, area1] = get_area(1 as SurfaceIdentification, "working area 2")
  area2 = bbox.normalize(area1)

  originalBlueprintSample = getBlueprintSample("original")
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
    pasteBlueprint(surface, area.left_top, originalBlueprintSample)
    const bp = MutableBlueprint.fromPlainEntities(originalBlueprintSample)
    const assembly = Assembly.create("test", surface, area)
    assertBlueprintsEquivalent(bp, assembly.ownContents)
  })
})

describe("refreshInWorld", () => {
  before_each(() => {
    clearBuildableEntities(surface, area)
  })
  test("refreshing an empty assembly clears area", () => {
    const assembly = Assembly.create("test", surface, area)
    pasteBlueprint(surface, area.left_top, originalBlueprintSample)
    assembly.refreshInWorld()
  })
  test("refreshing an assembly with entities sets entities", () => {
    pasteBlueprint(surface, area.left_top, originalBlueprintSample)
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
    const mockImport: ImportContent = {
      getContents: () => MutableBlueprint.fromPlainEntities(originalBlueprintSample),
    }
    assembly.addImport(mockImport, pos(0, 0))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    const expected = MutableBlueprint.fromPlainEntities(originalBlueprintSample)
    assertBlueprintsEquivalent(expected, bp)
  })
  test("adding import to blueprint adds to in world at specified location", () => {
    const assembly = Assembly.create("test", surface, area)
    const mockImport: ImportContent = {
      getContents: () => MutableBlueprint.fromPlainEntities(originalBlueprintSample),
    }
    assembly.addImport(mockImport, pos(1, 1))
    assert.same({}, assembly.ownContents.entities)
    assembly.refreshInWorld()
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, bbox.shift(area, pos(1, 1))))
    const expected = MutableBlueprint.fromPlainEntities(originalBlueprintSample)
    assertBlueprintsEquivalent(expected, bp)
  })
  test("imported entities do not extend beyond bounding box", () => {
    const fakeEntities: BlueprintEntityRead[] = [
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
    const mockImport: ImportContent = {
      getContents: () => MutableBlueprint.fromPlainEntities(fakeEntities),
    }
    assembly.addImport(mockImport, pos(0, 0))
    assembly.refreshInWorld()
    const bp = MutableBlueprint.fromPlainEntities(takeBlueprint(surface, area))
    const expected = MutableBlueprint.fromPlainEntities(fakeEntities.slice(0, 1))
    assertBlueprintsEquivalent(expected, bp)
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
