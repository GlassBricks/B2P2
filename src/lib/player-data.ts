/** @noSelfInFile */
import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"

export interface PlayerData<T> {
  data: Record<number, T>
}

declare const global: {
  __playerData: Record<string, Record<number, never>>
}

Events.on_init(() => {
  global.__playerData = {}
})

const usedPlayerData: Record<string, true> = {}

export const __TestPlayerDataName = "@@ Test Player data @@" as const

export function PlayerData<T>(name: string, init: (player: LuaPlayer) => T): PlayerData<T>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined> {
  checkIsBeforeLoad()

  if (name in usedPlayerData && name !== __TestPlayerDataName) {
    error(`Player data with name "${name}" already in use`)
  }
  const result: PlayerData<T> = { data: undefined! }

  function on_load() {
    result.data = global.__playerData[name]
    if (!result.data) {
      if (name === __TestPlayerDataName) {
        result.data = {}
      }
    }
  }

  function on_init() {
    global.__playerData[name] = {}
    on_load()
    if (init) {
      const data = result.data
      for (const [index, player] of pairs(game.players)) {
        data[index] = init(player)
      }
    }
  }

  function on_configuration_changed() {
    if (!global.__playerData[name]) on_init()
  }
  Events.onAll({
    on_init,
    on_load,
    on_configuration_changed,
    on_player_removed({ player_index }) {
      result.data[player_index] = undefined!
    },
  })
  if (init)
    Events.on_player_created(({ player_index }) => {
      result.data[player_index] = init(game.players[player_index])
    })

  return result
}
