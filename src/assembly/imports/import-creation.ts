import { Prototypes } from "../../constants"
import { Callback, Events, PlayerData, protectedAction } from "../../lib"
import { bbox } from "../../lib/geometry/bounding-box"
import { pos } from "../../lib/geometry/position"
import { UP } from "../../lib/geometry/rotation"
import { Mutable } from "../../lib/util-types"
import { L_Interaction } from "../../locale"
import { Assembly } from "../Assembly"
import { tryClearCursor } from "../assembly-creation"
import { highlightImport } from "./AssemblyImport"
import { BasicImport } from "./BasicImport"

const PendingImportCreation = PlayerData<PendingImportCreation | undefined>("PendingImportCreation")
interface PendingImportCreation {
  source: Assembly
  target: Assembly
  flipped?: boolean
  rotated?: boolean
  callback?: Callback
}

export function startBasicImportCreation(
  player: LuaPlayer,
  target: Assembly,
  source: Assembly,
  callback?: Callback,
): boolean {
  if (!tryClearCursor(player)) return false
  if (!source.isValid() || !target.isValid()) return false

  const content = source.getContent()!.resultContent.get()!

  const stack: BlueprintItemStack = player.cursor_stack
  stack.set_stack(Prototypes.ImportPreview)

  const entities = content.asArray()
  let nextEntityNumber = maxUsedEntityNumber(entities) + 1
  const boundaryTiles = createBoundaryTiles(bbox.size(source.area))
  for (const boundaryTile of boundaryTiles) {
    boundaryTile.entity_number = nextEntityNumber++
  }
  const markerEntity = {
    entity_number: nextEntityNumber++,
    name: Prototypes.ImportPreviewPositionMarker,
    position: pos(0, 0),
  }

  const resultEntities = [...entities, ...boundaryTiles, markerEntity]
  stack.set_blueprint_entities(resultEntities)

  stack.blueprint_absolute_snapping = true
  PendingImportCreation[player.index] = { source, target, callback }
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
function maxUsedEntityNumber(entities: readonly BlueprintEntityRead[]): number {
  return entities.reduce((max, entity) => Math.max(max, entity.entity_number), 0)
}
function createBoundaryTiles(size: MapPositionTable) {
  const name = Prototypes.ImportPreviewBoundaryTile
  const tiles: Tile[] = []
  const { x: mx, y: my } = size
  for (let x = 0; x < mx; x++) {
    tiles.push({ name, position: { x, y: 0 } })
    tiles.push({ name, position: { x, y: my - 1 } })
  }
  for (let y = 1; y < my - 1; y++) {
    tiles.push({ name, position: { x: 0, y } })
    tiles.push({ name, position: { x: mx - 1, y } })
  }
  return tiles as Mutable<BlueprintEntityRead>[]
}

function tryImportCreation(player: LuaPlayer, absolutePosition: MapPositionTable) {
  const pending = PendingImportCreation[player.index]
  assert(pending, "no pending import creation when import preview was placed")

  const { source, target, flipped, rotated, callback } = pending!
  if (!target.isValid() || !source.isValid()) {
    player.create_local_flying_text({ text: [L_Interaction.ImportNoLongerValid], create_at_cursor: true })
    player.cursor_stack!.clear()
    return
  }

  if (flipped || rotated) {
    player.create_local_flying_text({ text: [L_Interaction.CannotFlipOrRotateImport], create_at_cursor: true })
    return
  }

  const content = target.getContent()!

  const relativePosition = pos.sub(absolutePosition, target.area.left_top)
  const newImport = BasicImport.createFor(source, target, relativePosition)

  content.saveAndAddImport(newImport)
  highlightImport(target.surface, target.area, newImport, player)
  callback?.()

  player.cursor_stack!.clear()
}

function onBuiltHandler(e: OnBuiltEntityEvent) {
  const entity = e.created_entity
  const name = entity.name
  const realName = name === "entity-ghost" ? entity.ghost_name : name
  if (realName === Prototypes.ImportPreviewPositionMarker) {
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
    script.on_event(defines.events.on_built_entity, onBuiltHandler)
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
