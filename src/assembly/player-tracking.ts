import { PRecord } from "../lib/util-types"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { Assembly, AssemblyCreated, AssemblyDeleted } from "./Assembly"
import { Events, PlayerData } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { pos } from "../lib/geometry/position"
import contains = bbox.contains

type AssembliesByChunk = PRecord<NumberPair, MutableLuaSet<Assembly>>

declare const global: {
  assembliesByChunk: PRecord<SurfaceIndex, AssembliesByChunk>
}

Events.on_init(() => {
  global.assembliesByChunk = {}
})
Events.on_surface_deleted((e) => {
  delete global.assembliesByChunk[e.surface_index]
})

AssemblyCreated.subscribe((assembly) => {
  const surfaceIndex = assembly.surface.index
  const assembliesByChunk = global.assembliesByChunk[surfaceIndex] || (global.assembliesByChunk[surfaceIndex] = {})
  const chunkArea = bbox.scale(assembly.area, 1 / 32).roundTile()
  for (const [x, y] of chunkArea.iterateTiles()) {
    const hash = pair(x, y)
    const assemblies = assembliesByChunk[hash] || (assembliesByChunk[hash] = new LuaSet())
    assemblies.add(assembly)
  }
})

AssemblyDeleted.subscribe((assembly) => {
  const surface = assembly.surface
  if (!surface.valid) return
  const assembliesByChunk = global.assembliesByChunk[surface.index]
  if (!assembliesByChunk) return
  const chunkArea = bbox.scale(assembly.area, 1 / 32).roundTile()
  for (const [x, y] of chunkArea.iterateTiles()) {
    const hash = pair(x, y)
    const assemblies = assembliesByChunk[hash]
    if (assemblies) {
      assemblies.delete(assembly)
      if (!assemblies.first()) delete assembliesByChunk[hash]
    }
  }
})

export function getAssemblyAtPosition(surfaceIndex: SurfaceIndex, position: MapPositionTable): Assembly | undefined {
  const assembliesByChunk = global.assembliesByChunk[surfaceIndex]
  if (!assembliesByChunk) return
  const chunkArea = pos.div(position, 32).floor()
  const hash = pair(chunkArea.x, chunkArea.y)
  const assemblies = assembliesByChunk[hash]
  if (!assemblies) return
  for (const [assembly] of assemblies) {
    if (contains(assembly.area, position)) return assembly
  }
}

// minor optimization: store last assembly that player was in, to avoid some lookups
const LastAssembly = PlayerData<Assembly>("lastAssembly")

function computeAssemblyAtPlayerLocation(player: LuaPlayer): Assembly | undefined {
  const index = player.index
  const position = player.position
  const lastAssembly = LastAssembly[index]
  if (lastAssembly && lastAssembly.isValid() && contains(lastAssembly.area, position)) return lastAssembly
  return (LastAssembly[index] = getAssemblyAtPosition(player.surface.index, position))
}

Events.on_player_changed_position((e) => {
  computeAssemblyAtPlayerLocation(game.get_player(e.player_index)!)
})

AssemblyDeleted.subscribe((assembly) => {
  for (const [index, a] of LastAssembly) {
    if (a === assembly) delete LastAssembly[index]
  }
})

AssemblyCreated.subscribe((assembly) => {
  for (const [index, a] of LastAssembly) {
    if (a === undefined) {
      const player = game.players[index]
      if (player.surface === assembly.surface && contains(assembly.area, player.position)) {
        LastAssembly[index] = assembly
      }
    }
  }
})

export function getAssemblyAtPlayerLocation(playerIndex: PlayerIndex): Assembly | undefined {
  return LastAssembly[playerIndex]
}
