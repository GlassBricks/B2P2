import { clearBuildableEntities } from "../blueprint/world"
import { Entity } from "../entity/entity"
import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import { getWorkingArea1, getWorkingArea2 } from "../test/misc"
import { EntitySourceMapBuilder, getEntitySourceLocation } from "./EntitySourceMap"

let surface: LuaSurface
let area: BoundingBoxClass
let area2: BoundingBoxClass
before_all(() => {
  ;[surface, area] = getWorkingArea1()
  ;[, area2] = getWorkingArea2()
})
before_each(() => {
  clearBuildableEntities(surface, area)
})

test("add from in-world", () => {
  const relativePos = pos(2.5, 2.5)
  const entity = surface.create_entity({
    name: "small-electric-pole",
    position: pos.add(area.left_top, relativePos),
  })!
  assert(entity)

  const map = new EntitySourceMapBuilder().addAll([entity], { surface, area: area2 }, area.left_top).build()

  const lookupEntity: Entity = {
    name: "small-electric-pole",
    position: relativePos,
  }
  assert.same(
    bbox.fromCoords(2, 2, 3, 3).shift(area2.left_top),
    getEntitySourceLocation(map, lookupEntity, area.left_top)?.area,
  )
})
