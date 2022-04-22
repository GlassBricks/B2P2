import { PlayerData } from "./player-data"
import { getPlayer } from "./test-util/misc"

const TestPlayerDataName = "-- Test player data --"
const TestData = PlayerData(TestPlayerDataName, () => 1)

test("Can get and set", () => {
  const player = getPlayer()
  TestData[player.index] = 3
  assert.equal(3, TestData[player.index])
})

test("Update and delete on player created/removed", () => {
  script.get_event_handler(defines.events.on_player_created)({
    player_index: 10000 as PlayerIndex,
    name: defines.events.on_player_created,
    tick: game.tick,
  })
  assert.equal(1, TestData[10000 as PlayerIndex])
  script.get_event_handler(defines.events.on_player_removed)({
    player_index: 10000 as PlayerIndex,
    name: defines.events.on_player_created,
    tick: game.tick,
  })
  assert.is_nil(TestData[10000 as PlayerIndex])
})

declare const global: any
after_all(() => {
  global.__playerData[TestPlayerDataName] = undefined
})
