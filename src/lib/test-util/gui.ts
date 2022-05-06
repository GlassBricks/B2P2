import { cleanGuiInstances, destroy, ElementSpec, GuiEvent, render, Spec } from "../factoriojsx"
import { getPlayer } from "./misc"

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
    destroy(element)
    const count = cleanGuiInstances()
    if (count > 0) {
      error(`${count} GUI instances were not cleaned up`)
    }
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

export function findElementSatisfying(
  element: LuaGuiElement,
  predicate: (element: LuaGuiElement) => boolean,
): LuaGuiElement | undefined {
  if (predicate(element)) return element
  for (const child of element.children) {
    const found = findElementSatisfying(child, predicate)
    if (found) {
      return found
    }
  }
}

export function findAllElementsSatisfying(
  element: LuaGuiElement,
  predicate: (element: LuaGuiElement) => boolean,
  result: LuaGuiElement[] = [],
): LuaGuiElement[] {
  if (predicate(element)) {
    result.push(element)
  }
  for (const child of element.children) {
    findAllElementsSatisfying(child, predicate, result)
  }
  return result
}

export function findWithType<T extends GuiElementType>(
  parent: LuaGuiElement,
  type: T,
  predicate?: (element: Extract<LuaGuiElement, { type: T }>) => boolean,
): Extract<LuaGuiElement, { type: T }> {
  const actualPredicate = predicate ?? (() => true)
  return (
    (findElementSatisfying(parent, (element) => element.type === type && actualPredicate(element as any)) as any) ??
    error(`Could not find element of type "${type}" in ${getDescription(parent)}`)
  )
}

export function findAllWithType<T extends GuiElementType>(
  parent: LuaGuiElement,
  type: T,
  predicate?: (element: Extract<LuaGuiElement, { type: T }>) => boolean,
): Extract<LuaGuiElement, { type: T }>[] {
  const actualPredicate = predicate ?? (() => true)
  return findAllElementsSatisfying(parent, (element) => element.type === type && actualPredicate(element as any)) as any
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
export class ElementWrapper<T extends GuiElementType = GuiElementType> {
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

  find<T extends GuiElementType>(
    type: T,
    predicate?: (element: Extract<LuaGuiElement, { type: T }>) => boolean,
  ): ElementWrapper<T> {
    return new ElementWrapper(findWithType(this.native, type, predicate))
  }

  findAll<T extends GuiElementType>(
    type: T,
    predicate?: (element: Extract<LuaGuiElement, { type: T }>) => boolean,
  ): ElementWrapper<T>[] {
    return findAllWithType(this.native, type, predicate).map((element) => new ElementWrapper(element))
  }

  findSatisfying(predicate: (element: LuaGuiElement) => boolean): ElementWrapper {
    return new ElementWrapper(
      findElementSatisfying(this.native, predicate) ?? error(`Could not find element satisfying predicate`),
    )
  }

  findAllSatisfying(predicate: (element: LuaGuiElement) => boolean): ElementWrapper[] {
    return findAllElementsSatisfying(this.native, predicate).map((element) => new ElementWrapper(element))
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

export function testRender<T extends GuiElementType>(spec: ElementSpec & { type: T }): ElementWrapper<T>
export function testRender(spec: Spec): ElementWrapper
export function testRender(spec: Spec): ElementWrapper {
  const element = render(getPlayer().gui.screen, spec)
  if (!element) error("no elements rendered")
  makeTestRoot(element)
  return new ElementWrapper(element)
}
