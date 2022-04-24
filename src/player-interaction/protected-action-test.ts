import { getPlayer } from "../lib/test-util/misc"
import { protectedAction, userError } from "./protected-action"
import { L_Interaction } from "../locale"

test("Protected action with no error", () => {
  const player = getPlayer()
  const result = protectedAction(player, () => "test")
  assert.same("test", result)
})

test("Protected action with user error", () => {
  const player = getPlayer()
  rawset(player, "print", player.print)
  const print = stub(player, "print")
  const result = protectedAction(player, () => userError("test"))
  assert.is_nil(result)
  assert.spy(print).called_with("test")
})

test("Protected action with unexpected error", () => {
  const player = getPlayer()
  rawset(player, "print", player.print)
  const print = stub(player, "print")
  const result = protectedAction(player, () => error("test"))
  assert.is_nil(result)
  assert.equal(L_Interaction.UnexpectedError, (print.calls[0].vals[0] as [string])[0])
})
