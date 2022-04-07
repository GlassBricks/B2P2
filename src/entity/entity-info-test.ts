import { getEntityInfo, getTileArea } from "./entity-info"
import { bbox } from "../lib/geometry/bounding-box"
import { EntitySample, getEntitySample } from "../test/entity-sample"

describe.each<[EntitySample, BoundingBoxRead, string]>(
  [
    ["chest", bbox.fromCorners(0, 0, 1, 1), "container"],
    ["furnace", bbox.fromCorners(0, 0, 2, 2), "furnace"],
    ["assembling-machine-1", bbox.fromCorners(0, 0, 3, 3), "assembling-machine"],
    ["splitter", bbox.fromCorners(0, 0, 2, 1), "transport-belt"],
    ["offshore-pump", bbox.fromCorners(0, 0, 1, 2), "<none> offshore-pump"],
  ],
  "entity %s",
  (name, boundingBox, group) => {
    let entity: BlueprintEntityRead
    before_all(() => {
      entity = getEntitySample(name)
    })

    test("bounding box is correct", () => {
      assert.same(boundingBox, getTileArea(entity).shiftToOrigin())
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
