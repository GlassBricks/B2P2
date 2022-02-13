import { bbox, BoundingBoxClass } from "../lib/geometry/bounding-box"
import { UP } from "../lib/geometry/rotation"

export interface EntityInfo {
  collisionBox: BoundingBoxClass
  fastReplaceGroup: string | undefined

  flippable: boolean
  rotatable: boolean
  canPasteRotation: boolean
}

const entityInfoCache: Record<string, EntityInfo> = {}

export function getEntityInfo(entityName: string): EntityInfo {
  if (entityInfoCache[entityName]) {
    return entityInfoCache[entityName]
  }

  const proto = game.entity_prototypes[entityName] ?? error(`Entity ${entityName} not found`)

  const collisionBox = bbox.from(proto.collision_box)

  const flippable = collisionBox.isCenteredRectangle()
  const rotatable = collisionBox.isCenteredSquare()

  // only assembling machines can have rotation pasted
  const canPasteRotation = proto.type === "assembling-machine" && rotatable

  const entityInfo: EntityInfo = {
    collisionBox,
    fastReplaceGroup: proto.fast_replaceable_group,
    flippable,
    rotatable,
    canPasteRotation,
  }

  entityInfoCache[entityName] = entityInfo
  return entityInfo
}

// gets the area a blueprint entity takes, rounded to the nearest tile
export function getTileBox(entity: BlueprintEntityRead): BoundingBoxClass {
  // only conservative because of offshore pumps, is this worth it?
  return getEntityInfo(entity.name)
    .collisionBox.rotateAboutOrigin(entity.direction ?? UP)
    .shift(entity.position)
    .roundTileConservative()
}
