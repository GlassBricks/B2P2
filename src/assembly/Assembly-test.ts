import { Classes, isUserError } from "../lib"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import { getWorkingArea1 } from "../test/misc"
import { Assembly } from "./Assembly"

let area: BoundingBoxClass
let surface: LuaSurface

before_all(() => {
  ;[surface, area] = getWorkingArea1()
})
after_each(() => {
  for (const [assembly] of Assembly.getAllAssemblies()) {
    assembly.delete()
  }
})

test("registered", () => {
  Classes.nameOf(Assembly)
})
describe("lifecycle", () => {
  describe("create", () => {
    it("matches given parameters", () => {
      const assembly = Assembly.create("test", surface, area)
      assert.equal("test", assembly.name.get())
      assert.equal(surface, assembly.surface)
      assert.same(area, assembly.area)
      assert.is_true(assembly.isValid())
    })

    it("rounds tiles", () => {
      const assembly = Assembly.create("test", surface, bbox.fromCoords(0.5, 0.5, 1.5, 1.5))
      assert.same(bbox.fromCoords(0, 0, 2, 2), assembly.area)
    })

    it("errors if intersects with existing assembly", () => {
      Assembly.create("test1", surface, area)
      const sp = spy<any>()
      rawset(rendering, "draw_rectangle", sp)
      after_test(() => rawset(rendering, "draw_rectangle", undefined!))
      const error = assert.error(() => Assembly.create("test2", surface, area))
      assert.truthy(isUserError(error))
      assert.message("highlighted").spy(sp).called()
    })

    it("shows up in getAllAssemblies", () => {
      const assembly = Assembly.create("test", surface, area)
      assert.is_true(Assembly.getAllAssemblies().has(assembly))
    })
  })

  test("becomes invalid when surface deleted", () => {
    try {
      game.delete_surface("test")
    } catch {
      // ignore
    }

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
