import { AssembliesGlobal, Assembly, AssemblyId } from "./Assembly"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { get_area } from "__testorio__/testUtil/areas"
import { clearArea, pasteBlueprint } from "../world-interaction/blueprint"
import { getBlueprintSample } from "../test/blueprint-sample"
import { MutableBlueprint } from "../blueprint/Blueprint"
import { assertBlueprintsEquivalent } from "../test/blueprint"

declare const global: AssembliesGlobal

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
  for (const [, assembly] of pairs(global.assemblies)) {
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

    it("assigns unique ids", () => {
      const assembly1 = Assembly.create("test1", surface, area)
      const assembly2 = Assembly.create("test2", surface, area2)
      assert.not_equal(assembly1.id, assembly2.id)
    })

    it("errors if intersects with existing assembly", () => {
      Assembly.create("test1", surface, area)
      assert.error(() => Assembly.create("test2", surface, area))
    })
  })

  test("getById returns assembly", () => {
    const assembly = Assembly.create("test", surface, area)
    assert.equal(assembly, Assembly.getById(assembly.id))
  })
  test("getById returns undefined when does not exist", () => {
    assert.is_nil(Assembly.getById(1 as AssemblyId))
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

test("persists across game reload", () => {
  Assembly.create("test", surface, area)
  assert.equal(1, luaLength(global.assemblies))
}).after_mod_reload(() => {
  const assembly = Assembly.getById(1 as AssemblyId)
  assert.equal("test", assembly?.name)
})
