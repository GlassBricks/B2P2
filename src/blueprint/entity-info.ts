import { bbox, BoundingBoxClass } from "../utility/bounding-box"
import { UP } from "../utility/rotation"

export interface EntityInfo {
  collisionBox: BoundingBoxClass
}

const entityInfoCache: Record<string, EntityInfo> = {}

export function getEntityInfo(entityName: string): EntityInfo {
  if (entityInfoCache[entityName]) {
    return entityInfoCache[entityName]
  }

  const proto = game.entity_prototypes[entityName]
  const entityInfo: EntityInfo = {
    collisionBox: bbox.from(proto.collision_box),
  }

  entityInfoCache[entityName] = entityInfo
  return entityInfo
}

// gets the area a blueprint entity takes, rounded to the nearest tile
export function getTileArea(entity: BlueprintEntityRead): BoundingBoxClass {
  // only conservative because of offshore pumps, is this worth it?
  return getEntityInfo(entity.name)
    .collisionBox.rotateAboutOrigin(entity.direction ?? UP)
    .shift(entity.position)
    .roundTileConservative()
}
