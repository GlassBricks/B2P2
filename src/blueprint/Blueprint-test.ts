import { FullEntity } from "../entity/entity"
import { BBox, pos } from "../lib/geometry"
import { get } from "../lib/map2d"
import { getWorkingArea1 } from "../test/misc"
import { createEntityMap } from "./Blueprint"
import { ItemBlueprint } from "./ItemBlueprint"
import { LuaBlueprint } from "./LuaBlueprint"
import { clearBuildableEntities } from "./world"

let mockEntity: FullEntity, mockEntity2: FullEntity
before_all(() => {
  mockEntity = {
    name: "assembling-machine-1",
    position: { x: 0.5, y: 0.5 },
    entity_number: 1,
  }
  mockEntity2 = {
    name: "assembling-machine-2",
    position: { x: 0.5, y: 0.5 },
    entity_number: 2,
  }
})
describe("entity-map", () => {
  it("returns entity", () => {
    const bp = createEntityMap([mockEntity])
    const { x, y } = mockEntity.position
    assert.same(new LuaSet(mockEntity), get(bp, x, y))
  })

  it("does not round", () => {
    const bp = createEntityMap([mockEntity])
    assert.is_nil(get(bp, 0, 0))
    assert.is_nil(get(bp, 1, 1))
  })

  it("returns nil when no entity at pos", () => {
    const bp = createEntityMap([mockEntity])
    assert.same(undefined, get(bp, 10, 10))
  })

  it("returns all entities if overlapping", () => {
    const bp = createEntityMap([mockEntity, mockEntity2])
    const { x, y } = mockEntity.position
    assert.same(new LuaSet(mockEntity, mockEntity2), get(bp, x, y))
  })
})

describe("LuaBlueprint", () => {
  test("new blueprint is empty", () => {
    assert.same({}, LuaBlueprint.of().getEntities())
  })

  test("contents matches given", () => {
    const entities = [mockEntity, mockEntity2]
    const bp = LuaBlueprint.fromArray(entities)
    assert.same({ 1: mockEntity, 2: mockEntity2 }, bp.getEntities())
  })
})

describe("ItemBlueprint", () => {
  let surface: LuaSurface
  let area: BBox

  before_all(() => {
    ;[surface, area] = getWorkingArea1()
  })

  test("taking blueprint shifts entities in right position", () => {
    clearBuildableEntities(surface, area)
    const topLeft = area.left_top
    const offsetPos = pos.add(topLeft, { x: 2, y: 2 })
    const pos1 = pos.add(topLeft, { x: 3.5, y: 3.5 })
    const pos2 = pos.add(topLeft, { x: 7.5, y: 7.5 })
    surface.create_entity({ name: "iron-chest", position: pos1, force: "player" })
    surface.create_entity({ name: "iron-chest", position: pos2, force: "player" })

    const bp = ItemBlueprint.new(surface, area, offsetPos)
    assert.same(
      [
        {
          name: "iron-chest",
          position: { x: 1.5, y: 1.5 },
          entity_number: 1,
        },
        {
          name: "iron-chest",
          position: { x: 5.5, y: 5.5 },
          entity_number: 2,
        },
      ],
      bp.getEntities(),
    )
  })
})
