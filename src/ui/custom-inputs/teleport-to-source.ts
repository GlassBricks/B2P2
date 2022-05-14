import { highlightArea } from "../../area/AreaIdentification"
import { teleportPlayerToArea } from "../../area/teleport-history"
import { getAssemblyAtPosition } from "../../assembly/player-tracking"
import { getEntitySourceLocation } from "../../blueprint/EntitySourceMap"
import { Inputs } from "../../constants"
import { computeTileBoxOfLuaEntity } from "../../entity/entity-info"
import { Events, protectedAction } from "../../lib"
import { bbox } from "../../lib/geometry/bounding-box"
import { L_Interaction } from "../../locale"

function teleportToSourceOfEntity(player: LuaPlayer, entity: LuaEntity): void {
  const assembly = getAssemblyAtPosition(entity.surface.index, entity.position)
  if (!assembly || !assembly.isValid()) {
    player.create_local_flying_text({
      text: [L_Interaction.NoAssemblyHere],
      create_at_cursor: true,
    })
    return
  }
  const sourceMap = assembly.getContent()!.entitySourceMap.get()!

  const source = getEntitySourceLocation(sourceMap, entity, undefined)
  if (!source) {
    player.create_local_flying_text({
      text: [L_Interaction.EntityHasNoSource],
      create_at_cursor: true,
    })
    return
  }
  const thisTileBox = computeTileBoxOfLuaEntity(entity)
  if (entity.surface === source.surface && bbox.equals(thisTileBox, source.area)) {
    player.create_local_flying_text({
      text: [L_Interaction.EntityAlreadyAtSource],
      create_at_cursor: true,
    })
    return
  }
  teleportPlayerToArea(player, source)
  highlightArea(source, "copy", {
    blink_interval: 20,
    time_to_live: 120,
  })
}

Events.on(Inputs.TeleportToSource, (event) => {
  const player = game.get_player(event.player_index)!
  const entity = player.selected
  if (!entity) return
  protectedAction(player, teleportToSourceOfEntity, player, entity)
})
