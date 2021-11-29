/** @noSelfInFile */
import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"

export type PlayerData<T> = Record<number, T>

declare const global: {
  __playerData: Record<string, Record<number, never>>
}

Events.on_init(() => {
  global.__playerData = {}
})

const notLoadedMetatable: LuaMetatable<object> = {
  __index() {
    error("Cannot get player data, game not yet loaded")
  },
  __newindex() {
    error("Cannot set player data, game not yet loaded")
  },
}

const usedPlayerData: Record<string, true> = {}

export const __TestPlayerDataName = "@@ Test Player data @@" as const

export function PlayerData<T>(name: string, init: (player: LuaPlayer) => T): PlayerData<T>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined> {
  checkIsBeforeLoad()

  const rData: PlayerData<T> = setmetatable({}, notLoadedMetatable)
  if (name in usedPlayerData && name !== __TestPlayerDataName) {
    error(`Player data with name "${name}" already in use`)
  }
  let data!: Record<number, T>

  function on_load() {
    data = global.__playerData[name]
    if (!data) {
      if (name === __TestPlayerDataName) {
        data = {}
      } else {
        error(`Player data ${name} does not exists. Check that migrations were performed properly.`)
      }
    }
    setmetatable(rData, {
      __index: data,
      __newindex: data,
    })
  }

  Events.onAll({
    on_init() {
      global.__playerData[name] = {}
      on_load()
      if (init) {
        for (const [index, player] of pairs(game.players)) {
          data[index] = init(player)
        }
      }
    },
    on_load,
    on_player_removed({ player_index }) {
      data[player_index] = undefined!
    },
  })

  if (init)
    Events.on_player_created(({ player_index }) => {
      data[player_index] = init(game.players[player_index])
    })

  return rData
}
