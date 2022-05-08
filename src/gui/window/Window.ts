import { Component, ComponentClass, destroy, EmptyProps, render, Spec, Tracker } from "../../lib/factoriojsx"

export type ConcreteWindow = ComponentClass<EmptyProps> & typeof Window

export abstract class Window implements Component<EmptyProps> {
  // implements instead of extends to reduce prototype chain

  static readonly _fullName: string | undefined
  public static getName(this: ConcreteWindow): string {
    let name = rawget(this, "_fullName" as any)
    if (name) return name
    name = `${script.mod_name}:bbpp:${this.name}`
    rawset(this, "_fullName", name)
    return name
  }
  private static create(this: ConcreteWindow, screen: LuaGuiElement): void {
    const element = render(screen, { type: this, props: {} })
    if (element) element.name = this.getName()
  }
  public static isOpen(this: ConcreteWindow, player: LuaPlayer): boolean {
    return player.gui.screen[this.getName()] !== undefined
  }

  public static open(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    destroy(screen[this.getName()])
    this.create(screen)
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
      this.create(screen)
    }
  }
  public static refreshIfOpen(this: ConcreteWindow, player: LuaPlayer): void {
    const screen = player.gui.screen
    const gui = screen[this.getName()]
    if (gui) {
      destroy(gui)
      this.create(screen)
    }
  }

  abstract render(props: EmptyProps, tracker: Tracker): Spec
  declare _props: EmptyProps

  onMount?(firstElement: LuaGuiElement, tracker: Tracker): void
  onDestroy?(): void
}
