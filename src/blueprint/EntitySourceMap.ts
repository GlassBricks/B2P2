import { AreaIdentification } from "../area/AreaIdentification"
import { Entity } from "../entity/entity"
import { computeTileBox, computeTileBoxOfLuaEntity } from "../entity/entity-info"
import { pos, Position } from "../lib/geometry"
import { Map2D } from "../lib/map2d"
import { createEntityPositionMap } from "./Blueprint"
import { findCompatibleEntity } from "./blueprint-paste"

export interface SourceMapEntity extends Entity {
  actualLocation: AreaIdentification
}

export type EntitySourceMap = Map2D<SourceMapEntity>

/**
 * Not serializable!
 *
 * Both input and output coordinates are absolute, not relative.
 */
export class EntitySourceMapBuilder {
  private entities: SourceMapEntity[] = []

  addAll(entities: Record<number, LuaEntity>, sourceArea: AreaIdentification, pastedLeftTop: Position): this {
    // actualArea = location - (pastedLeftTop - sourceLeftTop)
    const offset = pos.sub(sourceArea.area.left_top, pastedLeftTop)
    const surface = sourceArea.surface
    for (const [, entity] of pairs(entities)) {
      const area = computeTileBoxOfLuaEntity(entity).shift(offset)
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
    const area = computeTileBox(entity).shift(sourceArea.area.left_top)
    const pastedPosition = pos.add(entity.position, pastedLeftTop)
    this.entities.push({
      name: entity.name,
      direction: entity.direction,
      position: pastedPosition,
      actualLocation: { surface, area },
    })
    return this
  }

  build(): EntitySourceMap {
    return createEntityPositionMap(this.entities)
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
