import { Blueprint } from "./Blueprint"
import { Entity, getTileBox } from "../entity/entity"
import { bbox } from "../lib/geometry/bounding-box"

test("new blueprint is empty", () => {
  assert.same({}, Blueprint.fromArray([]).entities)
})

let mockEntity: Entity, mockEntity2: Entity
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
test("contents matches given", () => {
  const entities = [mockEntity, mockEntity2]
  const bp = Blueprint.fromArray(entities)
  assert.same({ 1: mockEntity, 2: mockEntity2 }, bp.entities)
})

describe("getAtPos", () => {
  it("returns entity", () => {
    const bp = Blueprint.fromArray([mockEntity])
    const { x, y } = mockEntity.position
    assert.same(new LuaSet(mockEntity), bp.getAtPos(x, y))
  })

  it("returns entity at all tiles covered after add", () => {
    const bp = Blueprint.fromArray([mockEntity])
    for (const [x, y] of bbox.iterateTiles(getTileBox(mockEntity))) {
      assert.same(new LuaSet(mockEntity), bp.getAtPos(x, y))
    }
  })

  it("returns nil when empty", () => {
    const bp = Blueprint.fromArray([])
    assert.is_nil(bp.getAtPos(0, 0))
  })

  it("returns nil when no entity at pos", () => {
    const bp = Blueprint.fromArray([mockEntity])
    assert.same(undefined, bp.getAtPos(10, 10))
  })

  it("returns all entities if overlapping", () => {
    const entities = [mockEntity, mockEntity2]
    const bp = Blueprint.fromArray(entities)
    const { x, y } = mockEntity.position
    assert.same(new LuaSet(mockEntity, mockEntity2), bp.getAtPos(x, y))
  })

  test("getAt same as getAtPos", () => {
    const bp = Blueprint.fromArray([mockEntity])
    const position = mockEntity.position
    assert.same(new LuaSet(mockEntity), bp.getAt(position))
  })
})
