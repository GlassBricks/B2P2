import { teleportAndHighlight, teleportBackward, teleportForward } from "../../area/teleport-history"
import { getAssemblyAtPosition } from "../../assembly/player-tracking"
import { getEntitySourceLocation } from "../../blueprint/EntitySourceMap"
import { Inputs } from "../../constants"
import { computeTileBoxOfLuaEntity } from "../../entity/entity-info"
import { Events, protectedAction } from "../../lib"
import { bbox } from "../../lib/geometry"
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
  const sourceMap = assembly.getContent()!.entitySourceMap

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

  teleportAndHighlight(player, source, "copy")
}

Events.on(Inputs.TeleportToSource, (event) => {
  const player = game.get_player(event.player_index)!
  const entity = player.selected
  if (!entity) return
  protectedAction(player, teleportToSourceOfEntity, player, entity)
})

Events.on(Inputs.TeleportForward, (event) => {
  const player = game.get_player(event.player_index)!
  protectedAction(player, teleportForward, player)
})

Events.on(Inputs.TeleportBackward, (event) => {
  const player = game.get_player(event.player_index)!
  protectedAction(player, teleportBackward, player)
})
