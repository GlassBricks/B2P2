import { Blueprint, BlueprintDiff, EntityGridBuilder } from "./EntityGrid"
import { compareEntities } from "./entity-diff"
import { BasicEntity } from "./Entity"

export function compareBlueprints(old: Blueprint, cur: Blueprint): BlueprintDiff {
  const changes = new EntityGridBuilder()
  const deletions = new EntityGridBuilder<BasicEntity>()

  const present: Record<number, true> = {}

  // find added or updated entities
  for (const [, entity] of pairs(cur.byEntityNumber)) {
    const pos = entity.tileBox.left_top
    // see if entity in same position in old assembly
    const oldEntity = old.getAtPos(pos.x, pos.y)
    if (!oldEntity) {
      changes.add(entity)
    } else {
      const update = compareEntities(oldEntity, entity)
      if (update === "incompatible") {
        // consider as new entity
        changes.add(entity)
      } else {
        present[oldEntity.entity_number] = true
        if (update) {
          changes.add(update)
        }
      }
    }
  }
  // find removed entities
  for (const [number, entity] of pairs(old.byEntityNumber)) {
    if (!present[number]) {
      deletions.add(entity)
    }
  }
  return {
    changes,
    deletions,
  }
}

//
// export interface AssemblyPasteResult {
//   assembly: EntityGrid
//   overlaps: {
//     oldEntity: AssemblyEntity
//     newEntity: AssemblyEntity
//   }[]
//   unpasteableUpdates: EntityPasteResult[]
// }
//
// /** Returns the result of pasting an assembly on top of another. */
// export function pasteAssembly(below: EntityGrid, toPaste: EntityGrid): AssemblyPasteResult {
//   const overlaps: AssemblyPasteResult["overlaps"] = []
//   const unpasteableUpdates: AssemblyPasteResult["unpasteableUpdates"] = []
//
//   const result = below.copy()
//   for (const [, newEntity] of pairs(toPaste.byEntityNumber)) {
//     // check for any overlaps in entire tile box
//     let matched = false
//     for (const [x, y] of bbox.iterateTiles(newEntity.tileBox)) {
//       const oldEntity = below.getAtPos(x, y)
//       if (!oldEntity) continue
//       matched = true
//
//       const update = compareEntities(oldEntity, newEntity)
//       if (update === "incompatible") {
//         // overlap
//         overlaps.push({
//           oldEntity,
//           newEntity,
//         })
//       } else if (update) {
//         const pasteResult = pasteEntityUpdate(oldEntity, update)
//         const { incompatibleProps, entity } = pasteResult
//         if (incompatibleProps.length > 0) {
//           unpasteableUpdates.push(pasteResult)
//         }
//         result.replaceUnsafe(oldEntity, entity)
//       }
//       break
//     }
//     if (!matched) {
//       result.add(newEntity)
//     }
//   }
//
//   return {
//     assembly: result.asBuilt(),
//     overlaps,
//     unpasteableUpdates,
//   }
// }
