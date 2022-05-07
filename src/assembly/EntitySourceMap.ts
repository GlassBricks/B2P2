import { Blueprint } from "../blueprint/Blueprint"
import { Entity } from "../entity/entity"
import { AssemblyImport } from "./imports/AssemblyImport"
import { findCompatibleEntity } from "../blueprint/blueprint-paste"
import { pos } from "../lib/geometry/position"
import sub = pos.sub

export type EntitySource = AssemblyImport | "ownContent"
export interface SourceMapEntity extends Entity {
  source: EntitySource
}

export type EntitySourceMap = Blueprint<SourceMapEntity>

/** Not serializable! */
export class EntitySourceMapBuilder {
  private entities: SourceMapEntity[] = []

  add(entity: Entity, source: AssemblyImport | "ownContent", worldTopLeft: MapPositionTable | undefined): this {
    const relativePosition = worldTopLeft ? sub(entity.position, worldTopLeft) : entity.position
    this.entities.push({
      name: entity.name,
      direction: entity.direction,
      position: relativePosition,
      source,
    })
    return this
  }

  addAll(
    entities: readonly Entity[],
    source: AssemblyImport | "ownContent",
    worldTopLeft: MapPositionTable | undefined,
  ): this {
    for (const entity of entities) {
      this.add(entity, source, worldTopLeft)
    }
    return this
  }

  build(): EntitySourceMap {
    return Blueprint._new(this.entities)
  }
}

export function getSourceOfEntity(map: EntitySourceMap, entity: Entity): EntitySource | undefined {
  const mapEntity = findCompatibleEntity(map, entity)
  if (mapEntity) {
    return mapEntity.source
  }
}
