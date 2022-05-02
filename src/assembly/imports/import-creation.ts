import { Assembly } from "../Assembly"
import { tryClearCursor } from "../assembly-creation"
import { Prototypes } from "../../constants"
import { Events, PlayerData } from "../../lib"
import { pos } from "../../lib/geometry/position"
import { BasicImport } from "./BasicImport"
import { protectedAction } from "../../player-interaction/protected-action"
import { mutableShallowCopy } from "../../lib/util"
import { UP } from "../../lib/geometry/rotation"
import { L_Interaction } from "../../locale"

const PendingImportCreation = PlayerData<PendingImportCreation | undefined>("PendingImportCreation")
interface PendingImportCreation {
  source: Assembly
  target: Assembly
  flipped?: boolean
  rotated?: boolean
}

export function startBasicImportCreation(player: LuaPlayer, target: Assembly, source: Assembly): boolean {
  if (!tryClearCursor(player)) return false
  if (!source.isValid() || !target.isValid()) return false
  const content = source.getContent()!.resultContent.get()!
  const stack: BlueprintItemStack = player.cursor_stack
  stack.set_stack(Prototypes.ImportPreview)
  const entities = mutableShallowCopy(content.asArray())
  entities.push({
    entity_number: entities[entities.length - 1].entity_number + 1,
    name: Prototypes.ImportPreviewPositionMarker,
    position: pos(0, 0),
  })
  stack.set_blueprint_entities(entities)
  stack.blueprint_absolute_snapping = true
  PendingImportCreation[player.index] = { source, target }
  return true
}
Events.on_player_cursor_stack_changed((e) => {
  const playerIndex = e.player_index
  if (!PendingImportCreation[playerIndex]) return
  const stack = game.get_player(playerIndex)!.cursor_stack
  if (!stack || !stack.valid_for_read || stack.name !== Prototypes.ImportPreview) {
    delete PendingImportCreation[playerIndex]
  }
})

function tryImportCreation(player: LuaPlayer, absolutePosition: MapPositionTable) {
  const pending = PendingImportCreation[player.index]
  assert(pending, "no pending import creation when import preview was placed")

  const { source, target, flipped, rotated } = pending!
  if (!target.isValid() || !source.isValid()) {
    player.print([L_Interaction.ImportNoLongerValid])
    player.cursor_stack!.clear()
    return
  }

  if (flipped || rotated) {
    player.print([L_Interaction.CannotFlipOrRotateImport])
    return
  }

  const relativePosition = pos.sub(absolutePosition, target.area.left_top)
  const newImport = BasicImport.createFor(source, target, relativePosition)
  target.getContent()!.imports.push(newImport)
  player.print([L_Interaction.ImportCreated, source.displayName.get(), target.displayName.get()])
  player.cursor_stack!.clear()
}

function destroyEverythingExceptMarker(e: OnBuiltEntityEvent) {
  const entity = e.created_entity
  const name = entity.name
  if (
    name === Prototypes.ImportPreviewPositionMarker ||
    (name === "ghost" && entity.ghost_name === Prototypes.ImportPreviewPositionMarker)
  ) {
    const player = game.get_player(e.player_index)!
    protectedAction(player, () => tryImportCreation(player, entity.position))
  }
  entity.destroy()
}

let destroyEverythingMode = false
function setDestroyMode(e: OnPreBuildEvent) {
  if (!destroyEverythingMode) {
    const pending = PendingImportCreation[e.player_index]
    if (pending) {
      pending.flipped = e.flip_horizontal || e.flip_vertical
      pending.rotated = e.direction !== undefined && e.direction !== UP
    }
    script.on_event(defines.events.on_built_entity, destroyEverythingExceptMarker)
    destroyEverythingMode = true
  }
}
function unsetDestroyMode(e: OnPreBuildEvent) {
  if (destroyEverythingMode) {
    delete PendingImportCreation[e.player_index]
    script.on_event(defines.events.on_built_entity, undefined)
    destroyEverythingMode = false
  }
}

Events.on_pre_build((e) => {
  const stack = game.get_player(e.player_index)!.cursor_stack
  if (stack && stack.valid && stack.valid_for_read && stack.name === Prototypes.ImportPreview) {
    setDestroyMode(e)
  } else {
    unsetDestroyMode(e)
  }
})
