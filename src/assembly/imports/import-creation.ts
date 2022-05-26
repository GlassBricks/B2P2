import { Prototypes } from "../../constants"
import { Callback, Events, Mutable, mutableShallowCopy, PlayerData, protectedAction } from "../../lib"
import { bbox, pos, Position, UP } from "../../lib/geometry"
import { L_Interaction } from "../../locale"
import { Assembly } from "../Assembly"
import { tryClearCursor } from "../assembly-creation"
import { highlightImport } from "./AssemblyImport"
import { BasicImport } from "./BasicImport"
import max = math.max

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

  const entities = content.getEntities()

  const shiftAmount = bbox.size(source.area).div(4).floor().times(2) // area/2, rounded to nearest 2
  let nextEntityNumber = 1
  const resultEntities: BlueprintEntityRead[] = []
  for (const [, entity] of pairs(entities as Record<number, BlueprintEntityRead>)) {
    const newEntity = mutableShallowCopy(entity)
    newEntity.position = pos.sub(newEntity.position, shiftAmount)
    resultEntities.push(newEntity)
    nextEntityNumber = max(nextEntityNumber, entity.entity_number)
  }

  const boundaryTiles = createBoundaryTiles(bbox.size(source.area), shiftAmount)
  for (const boundaryTile of boundaryTiles) {
    boundaryTile.entity_number = ++nextEntityNumber
    resultEntities.push(boundaryTile)
  }
  const markerEntity = {
    entity_number: ++nextEntityNumber,
    name: Prototypes.ImportPreviewPositionMarker,
    position: pos.times(shiftAmount, -1),
  }
  resultEntities.push(markerEntity)

  stack.set_stack(Prototypes.ImportPreview)
  stack.blueprint_snap_to_grid = [2, 2]
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
function createBoundaryTiles(size: Position, shiftAmount: Position): Mutable<BlueprintEntityRead>[] {
  const name = Prototypes.ImportPreviewBoundaryTile
  const tiles: Tile[] = []
  const { x: mx, y: my } = size
  const { x: sx, y: sy } = shiftAmount
  // mx -= sx + 1
  // my -= sy + 1
  const lx = mx - sx - 1
  const ly = my - sy - 1
  for (let x = 0; x < mx; x++) {
    tiles.push({ name, position: { x: x - sx, y: -sy } })
    tiles.push({ name, position: { x: x - sx, y: ly } })
  }
  for (let y = 1; y < my - 1; y++) {
    tiles.push({ name, position: { x: -sx, y: y - sy } })
    tiles.push({ name, position: { x: lx, y: y - sy } })
  }
  return tiles as Mutable<BlueprintEntityRead>[]
}

function tryImportCreation(player: LuaPlayer, absolutePosition: Position) {
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
