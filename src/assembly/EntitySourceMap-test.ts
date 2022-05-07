import { BoundingBoxClass } from "../lib/geometry/bounding-box"
import { getWorkingArea1 } from "../test/misc"
import { EntitySourceMapBuilder, getSourceOfEntity } from "./EntitySourceMap"
import { clearBuildableEntities } from "../world-interaction/blueprint"
import { Entity } from "../entity/entity"
import { pos } from "../lib/geometry/position"

let surface: LuaSurface
let area: BoundingBoxClass
before_all(() => {
  ;[surface, area] = getWorkingArea1()
})
before_each(() => {
  clearBuildableEntities(surface, area)
})

test("add manually", () => {
  const entity: Entity = {
    name: "iron-chest",
    position: pos(0.5, 0.5),
  }
  const map = new EntitySourceMapBuilder().add(entity, "ownContent", undefined).build()
  assert.same("ownContent", getSourceOfEntity(map, entity) ?? "nil")
})

test("add from in-world", () => {
  const relativePos = pos(2.5, 2.5)
  const entity = surface.create_entity({
    name: "small-electric-pole",
    position: pos.add(area.left_top, relativePos),
  })!
  assert(entity)

  const builder = new EntitySourceMapBuilder()
  builder.add(entity, "ownContent", area.left_top)
  const map = builder.build()

  const lookupEntity: Entity = {
    name: "small-electric-pole",
    position: relativePos,
  }
  assert.same("ownContent", getSourceOfEntity(map, lookupEntity) ?? "nil")
})
