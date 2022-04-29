import { destroy, render, Spec } from "../../lib/factoriojsx"
import { PostLoadAction } from "../../lib/test-util/load-action"

export interface Window {
  readonly name: string

  isOpen(player: PlayerIdentification): boolean

  open(player: PlayerIdentification): void
  close(player: PlayerIdentification): void

  toggle(player: PlayerIdentification): void

  openOrRefresh(player: PlayerIdentification): void
  refreshIfOpen(player: PlayerIdentification): void
}

function getPlayer(id: PlayerIdentification): LuaPlayer {
  return typeof id === "object" ? id : game.get_player(id) ?? error("Invalid player id: " + id)
}

const windows: Record<string, Window> = {}

export function addWindow(rawName: string, spec: Spec): Window {
  const name = `${script.mod_name}:window:${rawName}`
  function create(screen: LuaGuiElement): void {
    const element = render(screen, spec)
    element.name = name
  }
  const window: Window = {
    name,
    isOpen(id: PlayerIdentification): boolean {
      return name in getPlayer(id).gui.screen
    },
    open(id: PlayerIdentification): void {
      const screen = getPlayer(id).gui.screen
      destroy(screen[name])
      create(screen)
    },
    close(id: PlayerIdentification): void {
      const screen = getPlayer(id).gui.screen
      destroy(screen[name])
    },
    toggle(id: PlayerIdentification): void {
      const screen = getPlayer(id).gui.screen
      const gui = screen[name]
      if (gui) {
        destroy(gui)
      } else {
        create(screen)
      }
    },
    openOrRefresh(id: PlayerIdentification): void {
      const screen = getPlayer(id).gui.screen
      const gui = screen[name]
      if (gui) {
        destroy(gui)
      }
      create(screen)
    },
    refreshIfOpen(id: PlayerIdentification): void {
      const screen = getPlayer(id).gui.screen
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
    const actualAction = action ?? "openOrRefresh"
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
