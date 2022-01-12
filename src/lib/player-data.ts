import Events from "./Events"
import { checkCanModifyGameState, checkIsBeforeLoad } from "./setup"

export interface PlayerData<T> {
  readonly name: string
  readonly table: Record<number, T>
  [playerIndex: PlayerIndex]: T
}

declare const global: {
  __playerData: Record<string, Record<number, unknown>>
}
const usedPlayerData: Record<string, true> = {}

Events.on_init(() => {
  global.__playerData = {}
})

const notLoadedMetatable: LuaMetatable<PlayerData<any>, (this: PlayerData<any>, key: any) => any> = {
  __index(key) {
    let table = global.__playerData[this.name]
    if (!table) {
      if (game) {
        table = global.__playerData[this.name] = {}
      } else {
        // read during on_load: table not yet present, keep not loaded metatable
        // should be handled by migrations?
        return undefined
      }
    }
    rawset(this, "table", table)
    setmetatable(this, {
      __index: table,
      __newindex: table,
    })
    return this[key]
  },
  __newindex(key: number, value) {
    checkCanModifyGameState()
    const table = global.__playerData[this.name] ?? (global.__playerData[this.name] = {})
    rawset(this, "table", table)
    setmetatable(this, {
      __index: table,
      __newindex: table,
    })
    this.table[key] = value
  },
}

export function PlayerData<T>(name: string, init: (player: LuaPlayer) => T): PlayerData<T>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined> {
  checkIsBeforeLoad()

  if (name in usedPlayerData) {
    error(`Player data with name "${name}" already in use`)
  }
  const data: PlayerData<T> = setmetatable({ name, table: undefined! }, notLoadedMetatable)
  function on_init() {
    notLoadedMetatable.__index!.call(data, 1)
    if (init) {
      for (const [index, player] of game.players) {
        data[index] = init(player)
      }
    }
  }
  // todo: migrations
  Events.onAll({
    on_init,
    on_player_removed({ player_index }) {
      delete data[player_index]
    },
  })
  if (init)
    Events.on_player_created(({ player_index }) => {
      data[player_index] = init(game.players[player_index])
    })

  return data
}
