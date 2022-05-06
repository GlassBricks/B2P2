import Events from "./Events"
import { checkIsBeforeLoad } from "./setup"
import { PRecord } from "./util-types"

/**
 * Called when player is initialized (both during on_init and on_player_created).
 * @param action
 */
export function onPlayerInit(action: (index: PlayerIndex, player: LuaPlayer) => void): void {
  Events.onAll({
    on_init() {
      for (const [index, player] of game.players) {
        action(index, player)
      }
    },
    on_player_created(e): void {
      const index = e.player_index
      const player = game.get_player(index)!
      action(index, player)
    },
  })
}

export interface PlayerData<T> extends LuaPairsIterable<PlayerIndex, T> {
  readonly name: string
  clearAll<T>(this: PRecord<PlayerIndex, T | undefined>): void
  [playerIndex: PlayerIndex]: T
}

declare const global: {
  __playerData: Record<PlayerIndex, PRecord<string, unknown>>
}

let data: typeof global["__playerData"] | undefined

Events.onAll({
  on_init(): void {
    data = global.__playerData = {}
  },
  on_load(): void {
    data = global.__playerData
  },
  on_player_removed(e): void {
    delete data![e.player_index]
  },
})
onPlayerInit((index) => {
  data![index] = {}
})

function playerDataIt(name: string, index: PlayerIndex | undefined) {
  const [nextIndex, value] = next(data!, index)
  if (nextIndex !== undefined) {
    return $multi(nextIndex, value[name])
  }
}
const playerDataMetatable: LuaMetatable<PlayerData<any>> = {
  __index(key: PlayerIndex) {
    const tbl = data![key]
    return tbl && tbl[this.name]
  },
  __newindex(key: PlayerIndex, value: any) {
    data![key][this.name] = value
  },
  __pairs: function (this: PlayerData<any>) {
    if (!data) error("Game not yet loaded, cannot access player data")
    return $multi(playerDataIt, this.name, undefined)
  } as any,
}

const usedPlayerData = new LuaSet<string>()
export function PlayerData<T>(name: string, init: (player: LuaPlayer) => T): PlayerData<T>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined>
export function PlayerData<T>(name: string, init?: (player: LuaPlayer) => T): PlayerData<T | undefined> {
  checkIsBeforeLoad()

  if (name in usedPlayerData) {
    error(`Player data with name "${name}" already in use`)
  }
  usedPlayerData.add(name)

  const result: PlayerData<T> = setmetatable(
    {
      name,
      clearAll() {
        for (const [, pData] of pairs(data!)) {
          delete pData[name]
        }
      },
    } as PlayerData<T>,
    playerDataMetatable,
  )
  if (init) {
    onPlayerInit((index, player) => {
      result[index] = init(player)
    })
  }

  return result
}
