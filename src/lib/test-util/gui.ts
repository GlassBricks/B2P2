import { GuiEvent } from "../factoriojsx/spec"
import { render } from "../factoriojsx/render"
import { FactorioJsx } from "../factoriojsx"
import { getPlayer } from "./misc"
import JSX = FactorioJsx.JSX

const ROOT_TAG = "test-root-element"

export function isRoot(element: BaseGuiElement): boolean {
  return ROOT_TAG in element.tags
}

export function makeTestRoot(element: BaseGuiElement): void {
  element.tags = {
    ...element.tags,
    [ROOT_TAG]: true,
  }
  after_test(() => {
    if (element.valid) element.destroy()
  })
}

export function makeWrapper(): FlowGuiElement {
  const wrapper = getPlayer().gui.screen.add({ type: "flow" })
  makeTestRoot(wrapper)
  return wrapper
}

export function getDescription(element: LuaGuiElement): string {
  const path = []
  let current: GuiElementMembers | undefined = element
  while (current && !isRoot(current)) {
    const name = current.name
    path.push(name === "" ? `[${current.get_index_in_parent()}, ${current.type}]` : name)
    current = current.parent
  }
  path.push("<root>")
  return path.reverse().join(".")
}

export function findElement(
  element: LuaGuiElement,
  predicate: (element: LuaGuiElement) => boolean,
): LuaGuiElement | undefined {
  if (predicate(element)) return element
  for (const child of element.children) {
    const found = findElement(child, predicate)
    if (found) {
      return found
    }
  }
}

export function findWithType(parent: LuaGuiElement, type: GuiElementType): LuaGuiElement {
  return (
    findElement(parent, (element) => element.type === type) ??
    error(`Could not find element of type "${type}" in ${getDescription(parent)}`)
  )
}

export function simulateEvent<T extends GuiEvent>(
  element: LuaGuiElement,
  event: Omit<T, "element" | "tick" | "player_index">,
): void {
  script.get_event_handler(event.name)?.({
    element,
    player_index: element.player_index,
    tick: game.tick,
    ...event,
  } as T)
}

// fluent API of above
export class ElementWrapper<T extends GuiElementType> {
  constructor(public readonly native: Extract<LuaGuiElement, { type: T }>) {}

  simulateEvent<T extends GuiEvent>(event: Omit<T, "element" | "tick" | "player_index">): void {
    simulateEvent(this.native, event)
  }

  simulateClick(
    modifiers: {
      button?: defines.mouse_button_type
      alt?: boolean
      control?: boolean
      shift?: boolean
    } = {},
  ): void {
    this.simulateEvent<OnGuiClickEvent>({
      name: defines.events.on_gui_click,
      button: modifiers.button ?? defines.mouse_button_type.left,
      alt: modifiers.alt || false,
      control: modifiers.control || false,
      shift: modifiers.shift || false,
    })
  }

  find(type: GuiElementType): ElementWrapper<GuiElementType> {
    return new ElementWrapper(findWithType(this.native, type))
  }

  findSatisfying(predicate: (element: LuaGuiElement) => boolean): ElementWrapper<GuiElementType> {
    return new ElementWrapper(
      findElement(this.native, predicate) ?? error(`Could not find element satisfying predicate`),
    )
  }

  isRoot(): boolean {
    return isRoot(this.native)
  }

  isValid(): boolean {
    return this.native.valid
  }

  __eq(other: unknown): boolean {
    return other instanceof ElementWrapper && other.native === this.native
  }

  toString(): string {
    return getDescription(this.native)
  }
}

// jsx

export function testRender(spec: JSX.Element): ElementWrapper<GuiElementType> {
  const nativeElement = render(getPlayer().gui.screen, spec).nativeElement
  makeTestRoot(nativeElement)
  return new ElementWrapper(nativeElement)
}
