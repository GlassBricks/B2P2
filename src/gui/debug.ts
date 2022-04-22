import { destroy, render, Spec } from "../lib/factoriojsx"

const debugGuis: Record<string, Spec> = {}

export function addTestGui(spec: Spec, name: string): void {
  debugGuis[name] = spec
}

const TestGuiName = "bbpp:test:TestGui"
commands.add_command("testGui", "", (e) => {
  const playerIndex = e.player_index
  if (!playerIndex) return
  const player = game.players[playerIndex]

  const name = e.parameter
  if (!name) {
    player.print("Usage: testGui <name>")
    player.print("Available names: " + Object.keys(debugGuis).join(", "))
    return
  }
  if (!(name in debugGuis)) {
    player.print("No such test gui: " + name)
    return
  }
  const screen = player.gui.screen
  destroy(screen[TestGuiName], true)
  try {
    const instance = render(screen, debugGuis[name])
    instance.nativeElement.name = TestGuiName
  } catch (e) {
    player.print("Error rendering test gui: " + e)
  }
})
