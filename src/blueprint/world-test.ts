import { BBox, pos } from "../lib/geometry"
import { getWorkingArea1 } from "../test/misc"
import { LuaBlueprint } from "./LuaBlueprint"
import { clearBuildableEntities, pasteBlueprint, takeBlueprintWithIndex } from "./world"

let surface: LuaSurface
let area: BBox

before_all(() => {
  ;[surface, area] = getWorkingArea1()
})

before_each(() => {
  clearBuildableEntities(surface, area)
})

test("takeBlueprint and pasteBlueprint", () => {
  const topLeft = area.left_top
  const offsetPos = pos.add(topLeft, { x: 2, y: 2 })
  const pos1 = pos.add(topLeft, { x: 3.5, y: 3.5 })
  const pos2 = pos.add(topLeft, { x: 7.5, y: 7.5 })
  const entity1 = surface.create_entity({ name: "iron-chest", position: pos1, force: "player" })
  const entity2 = surface.create_entity({ name: "iron-chest", position: pos2, force: "player" })

  const [bpEntities, index] = takeBlueprintWithIndex(surface, area, offsetPos)
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
    bpEntities,
  )
  assert.equal(entity1, index[1])
  assert.equal(entity2, index[2])

  clearBuildableEntities(surface, area)
  const pastedEntities = pasteBlueprint(surface, offsetPos, LuaBlueprint._new(bpEntities), true)
  assert.equal(2, pastedEntities.length)

  assert.equal("iron-chest", pastedEntities[0].name)
  assert.same(pos1, pastedEntities[0].position)
  assert.equal("iron-chest", pastedEntities[1].name)
  assert.same(pos2, pastedEntities[1].position)
})
