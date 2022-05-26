import { FullEntity } from "../entity/entity"
import { get } from "../lib/map2d"
import { createEntityMap } from "./Blueprint"
import { LuaBlueprint } from "./LuaBlueprint"

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
describe("blueprintMap", () => {
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
