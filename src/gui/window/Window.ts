import { destroy, render, Spec } from "../../lib/factoriojsx"
import { PostLoadAction } from "../../lib/test-util/load-action"

export interface Window {
  readonly name: string

  isOpen(player: LuaPlayer): boolean

  open(player: LuaPlayer): void
  close(player: LuaPlayer): void

  toggle(player: LuaPlayer): void

  refreshIfOpen(player: LuaPlayer): void
}

const windows: Record<string, Window> = {}
export function addWindow(rawName: string, spec: Spec): Window {
  const name = `${script.mod_name}:window:${rawName}`
  function create(screen: LuaGuiElement): void {
    const element = render(screen, spec)
    if (element) element.name = name
  }
  const window: Window = {
    name,
    isOpen(id: LuaPlayer): boolean {
      return name in id.gui.screen
    },
    open(id: LuaPlayer): void {
      const screen = id.gui.screen
      destroy(screen[name])
      create(screen)
    },
    close(id: LuaPlayer): void {
      const screen = id.gui.screen
      destroy(screen[name])
    },
    toggle(id: LuaPlayer): void {
      const screen = id.gui.screen
      const gui = screen[name]
      if (gui) {
        destroy(gui)
      } else {
        create(screen)
      }
    },
    refreshIfOpen(id: LuaPlayer): void {
      const screen = id.gui.screen
      const gui = screen[name]
      if (gui) {
        destroy(gui)
        create(screen)
      }
    },
  }
  windows[rawName] = window
  return window
}

if (script.active_mods.debugadapter) {
  const loadGui = PostLoadAction("load-test-gui", ([name, action]: [string, string], player: LuaPlayer) => {
    if (!(name in windows)) {
      player.print("No such window: " + name)
      return
    }
    const actualAction = action ?? "open"
    if (!(actualAction in windows[name]) || action === "name") {
      player.print("No such action: " + actualAction)
      return
    }

    const [success, result] = xpcall(
      () => windows[name][actualAction as Exclude<keyof Window, "name">](player),
      debug.traceback,
    )
    if (success) {
      player.print(`${name} ${actualAction}`)
    } else {
      player.print(`${name} ${actualAction} failed: ${result}`)
    }
  })
  commands.add_command("testGui", "", (e) => {
    const playerIndex = e.player_index
    if (!playerIndex) return
    const player = game.players[playerIndex]

    const [name, action] = (e.parameter || "").split(" ")
    if (!name || name === "") {
      player.print("Usage: testGui <name>")
      player.print("Available names: " + Object.keys(windows).join(", "))
      return
    }

    loadGui([name, action])
  })
}

export function openWindow(name: string, player: LuaPlayer): void {
  if (!(name in windows)) {
    player.print("No such window: " + name)
    return
  }
  windows[name].open(player)
}
