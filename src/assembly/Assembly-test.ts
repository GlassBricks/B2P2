import { Assembly } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearArea, pasteBlueprint } from "../world-interaction/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { MutableBlueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"

let area: BoundingBoxClass
let area2: BoundingBoxClass
let surface: LuaSurface

before_all(() => {
  let [, area1] = get_area(1 as SurfaceIdentification, "working area 1")
  area = bbox.normalize(area1)
  ;[surface, area1] = get_area(1 as SurfaceIdentification, "working area 2")
  area2 = bbox.normalize(area1)
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

describe("contents", () => {
  before_each(() => {
    clearArea(surface, area)
  })
  test("initializing in an empty area yields empty ownContents ", () => {
    const assembly = Assembly.create("test", surface, area)
    assert.same({}, assembly.ownContents.entities)
  })

  test("initializing in an area with entities sets ownContents", () => {
    const blueprint = getBlueprintSample("original")
    pasteBlueprint(surface, area.left_top, blueprint)
    const bp = MutableBlueprint.fromEntities(blueprint)
    const assembly = Assembly.create("test", surface, area)
    assertBlueprintsEquivalent(bp, assembly.ownContents)
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
