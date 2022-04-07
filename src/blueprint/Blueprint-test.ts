import { MutableBlueprint } from "./Blueprint"
import { createEntity, Entity, EntityId } from "../entity/entity"
import { bbox } from "../lib/geometry/bounding-box"

let b: MutableBlueprint
before_each(() => {
  b = new MutableBlueprint()
})

test("new blueprint is empty", () => {
  assert.same({}, b.entities)
})

let mockEntity: Entity, mockEntity2: Entity, mockEntity3: Entity
before_all(() => {
  mockEntity = createEntity({
    name: "assembling-machine-1",
    position: { x: 0.5, y: 0.5 },
    entity_number: 1,
  })
  mockEntity2 = createEntity(
    {
      name: "assembling-machine-2",
      position: { x: 0.5, y: 0.5 },
      entity_number: 1,
    },
    2 as EntityId,
  )
  mockEntity3 = createEntity(
    {
      name: "assembling-machine-2",
      position: { x: 0.5, y: 0.5 },
      entity_number: 1,
    },
    3 as EntityId,
  )
})
test("adding entity adds to .entities", () => {
  b.addSingle(mockEntity)
  assert.same({ 1: mockEntity }, b.entities)
})

test("adding entity changes id", () => {
  const e2 = b.addSingle(mockEntity2)
  assert.same(e2.id, 1)
  assert.same({ 1: e2 }, b.entities)
})

describe("getAtPos", () => {
  it("returns entity after add", () => {
    const e = b.addSingle(mockEntity)
    const { x, y } = mockEntity.entity.position
    assert.same(new LuaSet(e), b.getAtPos(x, y))
  })

  it("returns entity at all tiles covered after add", () => {
    const e = b.addSingle(mockEntity)
    for (const [x, y] of bbox.iterateTiles(e.tileBox)) {
      assert.same(new LuaSet(e), b.getAtPos(x, y))
    }
  })

  it("returns nil when empty", () => {
    assert.is_nil(b.getAtPos(0, 0))
  })

  it("returns nil when no entity at pos", () => {
    b.addSingle(mockEntity)
    assert.same(undefined, b.getAtPos(10, 10))
  })

  it("returns all entities if overlapping", () => {
    const e1 = b.addSingle(mockEntity)
    const e2 = b.addSingle(mockEntity2)
    const { x, y } = mockEntity.entity.position
    assert.same(new LuaSet(e1, e2), b.getAtPos(x, y))
  })

  test("getAt same as getAtPos", () => {
    const e = b.addSingle(mockEntity)
    const position = mockEntity.entity.position
    assert.same(new LuaSet(e), b.getAt(position))
  })
})

describe("replaceUnsafe", () => {
  it("replaces entity", () => {
    const e1 = b.addSingle(mockEntity)
    const e2 = b.replaceUnsafe(e1, mockEntity2)
    assert.same({ 1: e2 }, b.entities)
  })

  it("errors when replacing non-added entity", () => {
    assert.error(() => b.replaceUnsafe(mockEntity, mockEntity2))
  })

  it("replaces entity at all tiles covered", () => {
    const e1 = b.addSingle(mockEntity)
    const e2 = b.replaceUnsafe(e1, mockEntity2)
    for (const [x, y] of bbox.iterateTiles(e2.tileBox)) {
      assert.same(new LuaSet(e2), b.getAtPos(x, y))
    }
  })

  it("replaces all entities and respects overlap", () => {
    const e1 = b.addSingle(mockEntity)
    const e2 = b.addSingle(mockEntity2)
    const e3 = b.replaceUnsafe(e1, mockEntity3)
    assert.same(new LuaSet(e2, e3), b.getAtPos(0.5, 0.5))
    for (const [x, y] of bbox.iterateTiles(e3.tileBox)) {
      assert.same(new LuaSet(e2, e3), b.getAtPos(x, y))
    }
  })
})

describe("remove", () => {
  it("removes entity", () => {
    const e = b.addSingle(mockEntity)
    b.remove(e)
    assert.same({}, b.entities)
  })

  it("errors when removing non-added entity", () => {
    assert.error(() => b.remove(mockEntity))
  })

  it("removes entity from all tiles covered", () => {
    const e = b.addSingle(mockEntity)
    b.remove(e)
    for (const [x, y] of bbox.iterateTiles(e.tileBox)) {
      assert.same(undefined, b.getAtPos(x, y))
    }
  })

  it("removes all entities and respects overlap", () => {
    const e1 = b.addSingle(mockEntity)
    const e2 = b.addSingle(mockEntity2)
    b.remove(e1)
    assert.same(new LuaSet(e2), b.getAtPos(0.5, 0.5))
    for (const [x, y] of bbox.iterateTiles(e2.tileBox)) {
      assert.same(new LuaSet(e2), b.getAtPos(x, y))
    }
  })
})
