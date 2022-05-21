import { AreaIdentification } from "../area/AreaIdentification"
import { Entity } from "../entity/entity"
import { computeTileBox, computeTileBoxOfLuaEntity } from "../entity/entity-info"
import { bbox, pos, Position } from "../lib/geometry"
import { Blueprint } from "./Blueprint"
import { findCompatibleEntity } from "./blueprint-paste"
import shift = bbox.shift

export interface SourceMapEntity extends Entity {
  actualLocation: AreaIdentification
}

export type EntitySourceMap = Blueprint<SourceMapEntity>

/**
 * Not serializable!
 *
 * Both input and output coordinates are absolute, not relative.
 */
export class EntitySourceMapBuilder {
  private entities: SourceMapEntity[] = []

  addAll(entities: readonly LuaEntity[], sourceArea: AreaIdentification, pastedLeftTop: Position): this {
    // actualArea = location - (pastedLeftTop - sourceLeftTop)
    const offset = pos.sub(sourceArea.area.left_top, pastedLeftTop)
    const surface = sourceArea.surface
    for (const entity of entities) {
      const area = shift(computeTileBoxOfLuaEntity(entity), offset)
      this.entities.push({
        name: entity.type === "entity-ghost" ? entity.ghost_name : entity.name,
        direction: entity.direction,
        position: entity.position,
        actualLocation: { surface, area },
      })
    }
    return this
  }

  addMock(entity: Entity, sourceArea: AreaIdentification, pastedLeftTop: Position): this {
    const surface = sourceArea.surface
    const entitySourceArea = shift(computeTileBox(entity), sourceArea.area.left_top)
    const pastedPosition = pos.add(entity.position, pastedLeftTop)
    this.entities.push({
      name: entity.name,
      direction: entity.direction,
      position: pastedPosition,
      actualLocation: { surface, area: entitySourceArea },
    })
    return this
  }

  build(): EntitySourceMap {
    return Blueprint._new(this.entities)
  }
}

export function getEntitySourceLocation(
  map: EntitySourceMap,
  entity: Entity,
  relativeOffset: Position | undefined,
): AreaIdentification | undefined {
  const actualPosition = relativeOffset && pos.add(entity.position, relativeOffset)
  const mapEntity = findCompatibleEntity(map, entity, actualPosition)
  if (mapEntity) return mapEntity.actualLocation
}
