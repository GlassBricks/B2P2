import { bbox } from "../lib/geometry"
import { EntitySampleName, getEntitySample } from "../test/entity-sample"
import { computeTileBox, getEntityInfo } from "./entity-info"

describe.each<[EntitySampleName, BoundingBoxRead, string]>(
  [
    ["chest", bbox.fromCoords(0, 0, 1, 1), "container"],
    ["furnace", bbox.fromCoords(0, 0, 2, 2), "furnace"],
    ["assembling-machine-1", bbox.fromCoords(0, 0, 3, 3), "assembling-machine"],
    ["splitter", bbox.fromCoords(0, 0, 2, 1), "transport-belt"],
    ["offshore-pump", bbox.fromCoords(0, 0, 1, 2), "<none> offshore-pump"],
  ],
  "entity %s",
  (name, boundingBox, group) => {
    let entity: BlueprintEntityRead
    before_all(() => {
      entity = getEntitySample(name)
    })

    test("bounding box is correct", () => {
      assert.same(boundingBox, computeTileBox(entity).shiftToOrigin())
    })

    test("entity group is correct", () => {
      assert.same(group, getEntityInfo(entity.name).entityGroup)
    })

    test("isRotationPasteable is correct", () => {
      const pasteable = name === "assembling-machine-1"
      assert.same(pasteable, getEntityInfo(entity.name).isRotationPasteable)
    })
  },
)
