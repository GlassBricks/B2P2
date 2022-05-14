import { Classes, Events, PlayerData } from "../lib"
import { bbox, Position } from "../lib/geometry"
import { AreaIdentification, highlightArea, PositionIdentification } from "./AreaIdentification"
import center = bbox.center

@Classes.register()
export class NavigationHistory<T> {
  constructor(public maxSize: number) {}

  protected items: T[] = []
  protected pointer = -1

  push2(from: T, to: T): void {
    this.items[++this.pointer] = from
    this.items[++this.pointer] = to
    this.items.length = this.pointer + 1
    while (this.pointer + 1 > this.maxSize) {
      table.remove(this.items, 1)
      this.pointer--
    }
  }

  next(): T | undefined {
    const nextIndex = this.pointer + 1
    if (nextIndex < this.items.length) {
      const value = this.items[nextIndex]
      this.pointer = nextIndex
      return value
    }
  }

  prev(): T | undefined {
    const prevIndex = this.pointer - 1
    if (prevIndex >= 0) {
      const value = this.items[prevIndex]
      this.pointer = prevIndex
      return value
    }
  }

  filter(predicate: (item: T) => boolean): void {
    const oldPointer = this.pointer
    let j = 0
    for (let i = 0; i < this.items.length; i++) {
      if (predicate(this.items[i])) {
        this.items[j] = this.items[i]
        j++
      } else if (i < oldPointer) {
        this.pointer--
      }
    }
    this.items.length = j
  }
}

type TeleportItem = PositionIdentification

const TeleportHistory = PlayerData("TeleportHistory", () => new NavigationHistory<TeleportItem>(20))

Events.on_surface_deleted(() => {
  for (const [, data] of TeleportHistory) {
    data.filter(({ surface }) => surface.valid)
  }
})

export function teleportPlayer(player: LuaPlayer, surface: LuaSurface, position: Position): void {
  const history = TeleportHistory[player.index]
  const currentPosition: PositionIdentification = {
    surface: player.surface,
    position: player.position,
  }
  history.push2(currentPosition, { surface, position })
  player.teleport(position, surface)
}

export function teleportPlayerToArea(player: LuaPlayer, area: AreaIdentification): void {
  teleportPlayer(player, area.surface, center(area.area))
}

export function teleportForward(player: LuaPlayer): boolean {
  const history = TeleportHistory[player.index]
  const item = history.next()
  if (item) {
    player.teleport(item.position, item.surface)
    return true
  }
  return false
}

export function teleportBackward(player: LuaPlayer): boolean {
  const history = TeleportHistory[player.index]
  const item = history.prev()
  if (item) {
    player.teleport(item.position, item.surface)
    return true
  }
  return false
}
export function teleportAndHighlight(
  player: LuaPlayer,
  area: AreaIdentification,
  highlightType: CursorBoxRenderType,
): void {
  player.close_map()
  teleportPlayerToArea(player, area)
  highlightArea(area, highlightType, {
    blink_interval: 20,
    time_to_live: 120,
    render_player_index: player.index,
  })
}
