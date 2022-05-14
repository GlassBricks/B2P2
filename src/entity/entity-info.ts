import { bbox, BoundingBoxClass, UP } from "../lib/geometry"
import { Entity } from "./entity"

export interface EntityInfo {
  readonly collisionBox: BoundingBoxClass
  readonly entityGroup: string
  readonly isRotationPasteable: boolean
}

const entityInfoCache: Record<string, EntityInfo> = {}

export function getEntityInfo(entityName: string): EntityInfo {
  if (entityInfoCache[entityName]) {
    return entityInfoCache[entityName]
  }

  const proto = game.entity_prototypes[entityName]
  const collisionBox = bbox.from(proto.collision_box)
  const entityInfo: EntityInfo = {
    collisionBox,
    entityGroup: proto.fast_replaceable_group ?? `<none> ${entityName}`,
    isRotationPasteable: proto.type === "assembling-machine" && collisionBox.isCenteredSquare(),
  }

  entityInfoCache[entityName] = entityInfo
  return entityInfo
}

// gets the area a blueprint entity takes, rounded to the nearest tile
export function computeTileBox(entity: Entity): BoundingBoxClass {
  // only conservative because of offshore pumps, is this worth it?
  return getEntityInfo(entity.name)
    .collisionBox.rotateAboutOrigin(entity.direction ?? UP)
    .shift(entity.position)
    .roundTileConservative()
}

export function computeTileBoxOfLuaEntity(entity: LuaEntity): BoundingBoxClass {
  return bbox.roundTileConservative(entity.bounding_box)
}
