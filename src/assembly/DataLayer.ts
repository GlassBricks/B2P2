import { Classes } from "../lib"
import { Layer } from "./Layer"
import { Blueprint, BlueprintPaste, MutableBlueprintPaste } from "../entity/Blueprint"
import { BasicEntity, UpdateableProp, UpdateEntity } from "../entity/Entity"
import { Mutable } from "../lib/util-types"

export type FlexibleUpdateEntity = UpdateEntity & Pick<Mutable<UpdateEntity>, UpdateableProp>
export type LayerContent = Blueprint<BasicEntity | FlexibleUpdateEntity>

@Classes.register()
export class DataLayer implements Layer {
  private content: LayerContent | undefined
  constructor(public name: string, content: BlueprintPaste = new MutableBlueprintPaste()) {
    this.content = content
  }

  getContent(): LayerContent | undefined {
    return this.content
  }
  //
  // isValid(): boolean {
  //   return this.content !== undefined
  // }
  // dispose(): void {
  //   this.content = undefined
  // }
  // returns false if this is already disposed
  setContent(content: LayerContent): boolean {
    // if (this.content === undefined) return false
    this.content = content
    return true
  }
}

/*

Layer update:

compare current content with old content, creating a diff
Also have the below layer

For each entity in the diff
    if is addition:
        if matches existing in the layer (meaning was not pasted)
            process as update (see below)
        else if matches an entity in below layer
            create an add (reference?) entity in the layer
        else
            create an add entity in the layer
    if is update:
        if matches existing in layer:
            if existing is reference entity
                find entity in below layer
                if the below entity no longer exists
                    update the entity directly; warning already given above
                else:
                    compare with below entity
                    update the reference entity
                    if this creates an unpasteable change
                        warn about unpasteable change
            else
                update the add entity
        else if matches an entity in below layer
            compare with below entity
            create a reference entity
        else
            should not happen, add warning
    if is deletion:
        if matches existing in layer:
            if existing is reference entity
                delete the reference entity
                add to not actually deleted list
            else
                delete the add entity
        else
            add to not actually deleted list



    Assumes layer is valid
 */
// export function dataLayerUpdate(
//   belowContent: BasicBlueprint,
//   layer: DataLayer,
//   diff: BlueprintDiff,
// ): { result: BlueprintPaste | undefined; diagnostics: Diagnostic[] } {
//   const layerContent = layer.getContent()!
//   const diagnostics: Diagnostic[] = []
//   if (!layerContent) {
//     diagnostics.push(invalidLayer(layer))
//     return { result: layerContent, diagnostics }
//   }
//
//   const result = layerContent.copy()
//
//   function updateLayerUpdateEntity(existing: UpdateEntity, entity: UpdateEntity) {
//     // reference entity updated
//     const belowEntity = findCompatibleEntity(belowContent, existing)
//     if (!belowEntity) {
//       // below entity no longer exists
//       result.replaceUnsafe(existing, entity)
//       return
//     }
//
//     const entityResult = updateUpdateEntity(belowEntity, existing, entity)
//     if (!entityResult) {
//       // no more changes, remove entity
//       result.remove(existing)
//       return
//     }
//
//     const unpasteableProps = getUnpasteableProps(entityResult)
//     if (unpasteableProps.length > 0) {
//       diagnostics.push(unpasteableEntity(entity, unpasteableProps))
//     }
//     result.replaceUnsafe(existing, entityResult)
//   }
//
//   function processUpdate(entity: UpdateEntity) {
//     const existing = findCompatibleEntity(layerContent, entity)
//     if (!existing) {
//       // new update entity
//       const belowEntity = findCompatibleEntity(belowContent, entity)
//       if (!belowEntity) {
//         // this should not happen
//         diagnostics.push(updateToNonexistentEntity(entity))
//         return
//       }
//       result.add(entity)
//       return
//     }
//
//     if (existing.diffType === "update") {
//       // update existing update entity
//       return updateLayerUpdateEntity(existing, entity)
//     }
//     // update existing add entity
//     const resultEntity = asBasicEntity(entity)
//     result.replaceUnsafe(existing, resultEntity)
//   }
//
//   for (const [, entity] of pairs(diff.entities)) {
//     if (entity.diffType === undefined) {
//       // this is ADD
//       // TODO: already existing in layer
//       result.add(entity)
//       continue
//     }
//
//     if (entity.diffType === "update") {
//       processUpdate(entity)
//     } else if (entity.diffType === "delete") {
//       const existing = findCompatibleEntity(layerContent, entity)
//       if (!existing) {
//         // this will not have an effect, warn
//         diagnostics.push(belowEntityDeleted(entity))
//         continue
//       }
//       result.remove(existing)
//     } else {
//       // this is ADD
//       result.add(entity)
//     }
//   }
// }
//
// function updateUpdateEntity(belowEntity: BasicEntity, old: UpdateEntity, diff: UpdateEntity): UpdateEntity | undefined {
//   // for now, ignore old
//   return compareCompatibleEntities(belowEntity, diff)
// }
