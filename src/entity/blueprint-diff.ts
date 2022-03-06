import { BasicBlueprint, BlueprintDiff, MutableBlueprintDiff } from "./EntityGrid"
import { compareCompatibleEntities, findCompatibleOrOverlappingEntity } from "./entity-diff"
import { createDeleteEntity } from "./Entity"

export function compareBlueprints(old: BasicBlueprint, cur: BasicBlueprint): BlueprintDiff {
  const diff = new MutableBlueprintDiff()
  const present: Record<number, true> = {}

  // find added or updated entities
  for (const [, entity] of pairs(cur.byEntityNumber)) {
    const existing = findCompatibleOrOverlappingEntity(old, entity)
    if (!existing || existing === "overlap") {
      // entity is new
      diff.add(entity)
    } else {
      present[existing.entity_number] = true
      const update = compareCompatibleEntities(existing, entity)
      if (update) {
        // entity is updated
        diff.add(update)
      }
    }
  }
  // find removed entities
  for (const [number, entity] of pairs(old.byEntityNumber)) {
    if (!present[number]) {
      diff.add(createDeleteEntity(entity))
    }
  }
  return diff
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
//       const oldEntity = below.getAt(x, y)
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
