import { __TestPlayerDataName, PlayerData } from "./player-data"
import { getPlayer } from "./testUtil"

const TestData = PlayerData<unknown>(__TestPlayerDataName, () => 1)

test("Can get and set", () => {
  const player = getPlayer()
  TestData.data[player.index] = 3
  assert.equal(3, TestData.data[player.index])
})

test("Update and delete on player created/removed", () => {
  script.get_event_handler(defines.events.on_player_created)({
    player_index: 10000,
    name: defines.events.on_player_created,
    tick: game.tick,
  })
  assert.equal(1, TestData.data[10000])
  script.get_event_handler(defines.events.on_player_removed)({
    player_index: 10000,
    name: defines.events.on_player_created,
    tick: game.tick,
  })
  assert.is_nil(TestData.data[10000])
})
