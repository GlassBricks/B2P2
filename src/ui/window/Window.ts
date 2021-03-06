import { Component, ComponentClass, destroy, EmptyProps, render } from "../../lib/factoriojsx"

export type ConcreteWindow = ComponentClass<EmptyProps> & typeof Window

export abstract class Window extends Component<EmptyProps> {
  static readonly _fullName: string | undefined
  public static getName(this: ConcreteWindow): string {
    let name = rawget(this, "_fullName" as any)
    if (name) return name
    name = `${script.mod_name}:b2p2:${this.name}`
    rawset(this, "_fullName", name)
    return name
  }
  private static create(this: ConcreteWindow, player: LuaPlayer): void {
    const element = render(player.gui.screen, { type: this, props: {} })
    if (element) {
      element.name = this.getName()
      player.opened = element
    }
  }
  public static isOpen(this: ConcreteWindow, player: LuaPlayer): boolean {
    return player.gui.screen[this.getName()] !== undefined
  }

  public static open(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    destroy(screen[this.getName()])
    this.create(player)
  }
  public static close(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    destroy(screen[this.getName()])
  }
  public static toggle(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    const gui = screen[this.getName()]
    if (gui) {
      destroy(gui)
    } else {
      this.create(player)
    }
  }
  public static refreshIfOpen(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    const gui = screen[this.getName()]
    if (gui) {
      destroy(gui)
      this.create(player)
    }
  }
}
