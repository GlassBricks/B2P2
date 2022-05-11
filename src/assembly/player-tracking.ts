import { Events, PlayerData } from "../lib"
import { bbox } from "../lib/geometry/bounding-box"
import { NumberPair, pair } from "../lib/geometry/number-pair"
import { pos } from "../lib/geometry/position"
import { MutableState, State, state } from "../lib/observable"
import { PRecord } from "../lib/util-types"
import { Assembly, AssemblyCreated, AssemblyDeleted } from "./Assembly"
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

const LastAssembly = PlayerData<MutableState<Assembly | undefined>>("lastAssembly", () => state(undefined))

function computeAssemblyAtPlayerLocation(player: LuaPlayer) {
  const index = player.index
  const position = player.position
  const surface = player.surface
  const lastAssemblyState = LastAssembly[index]
  const lastAssembly = lastAssemblyState.get()
  if (
    lastAssembly &&
    lastAssembly.isValid() &&
    lastAssembly.surface === surface &&
    contains(lastAssembly.area, position)
  )
    return lastAssembly
  const newAssembly = getAssemblyAtPosition(player.surface.index, position)
  lastAssemblyState.set(newAssembly)
}

Events.on_player_changed_position((e) => {
  computeAssemblyAtPlayerLocation(game.get_player(e.player_index)!)
})

AssemblyDeleted.subscribe((assembly) => {
  for (const [, a] of LastAssembly) {
    if (a.get() === assembly) a.set(undefined)
  }
})

AssemblyCreated.subscribe((assembly) => {
  for (const [index, a] of LastAssembly) {
    if (a.get() === undefined) {
      const player = game.players[index]
      if (player.surface === assembly.surface && contains(assembly.area, player.position)) {
        a.set(assembly)
      }
    }
  }
})

export function assemblyAtPlayerLocation(playerIndex: PlayerIndex): State<Assembly | undefined> {
  return LastAssembly[playerIndex]
}
