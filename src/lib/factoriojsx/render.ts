import { shallowCopy } from "../util"
import Events from "../Events"
import { PlayerData } from "../player-data"
import { bind, callWithoutSelf, Func, funcRef, Functions, isCallable } from "../references"
import { PRecord } from "../util-types"
import * as propTypes from "./propTypes.json"
import { ClassComponentSpec, ElementSpec, FCSpec, GuiEvent, GuiEventHandler, Spec } from "./spec"
import { isObservable, Observer, State, Subscription } from "../observable"

type GuiEventName = Extract<keyof typeof defines.events, `on_gui_${string}`>

interface ElementInstance {
  readonly nativeElement: GuiElementMembers
  readonly playerIndex: PlayerIndex
  readonly index: GuiElementIndex
  readonly subscriptions: Record<string, Subscription>

  children?: ElementInstance[]
  valid: boolean
  events: PRecord<GuiEventName, Func<any>>
}

// sinks
function setValueSink(
  this: {
    readonly instance: ElementInstance
    readonly element: { readonly valid: boolean } & Record<string, any>
    readonly key: string
  },
  value: any,
) {
  const { element } = this
  if (!element.valid) {
    destroy(this.instance)
    return
  }
  element[this.key] = value
}

function callMethodSink(
  this: {
    readonly instance: ElementInstance
    readonly element: { readonly valid: boolean } & Record<string, (this: void, arg: any) => any>
    readonly key: string
  },
  value: any,
) {
  const { element } = this
  if (!element.valid) {
    destroy(element as any)
    return
  }
  element[this.key](value)
}

function setSliderMinSink(
  this: {
    readonly instance: ElementInstance
    readonly element: SliderGuiElement
  },
  value: number,
) {
  const { element } = this
  if (!element.valid) {
    destroy(element as any)
    return
  }
  element.set_slider_minimum_maximum(value, element.get_slider_maximum())
}

function setSliderMaxSink(
  this: {
    readonly instance: ElementInstance
    readonly element: SliderGuiElement
  },
  value: number,
) {
  const { element } = this
  if (!element.valid) {
    destroy(element as any)
    return
  }
  element.set_slider_minimum_maximum(element.get_slider_minimum(), value)
}

function notifySink(this: { key: string; state: State<unknown> }, event: GuiEvent) {
  const key = this.key
  this.state.set((event as any)[key] || event.element![key])
}

function removeSubscription(this: { instance: ElementInstance; key: string }) {
  const { instance, key } = this
  const subscription = instance.subscriptions[key]
  if (subscription) {
    subscription.unsubscribe()
    delete instance.subscriptions[key]
  }
}

Functions.registerAll({
  setValueSink,
  callMethodSink,
  setSliderMinSink,
  setSliderMaxSink,
  notifySink,
  removeSubscription,
})

const Elements = PlayerData<Record<GuiElementIndex, ElementInstance>>("gui:Elements", () => ({}))

const type = _G.type

function renderInternal(parent: LuaGuiElement, element: Spec): ElementInstance {
  const elemType = element.type
  const elemTypeType = type(elemType)
  if (elemTypeType === "string") {
    return renderElement(parent, element as ElementSpec)
  }
  if (elemTypeType === "table") {
    return renderClassComponent(parent, element as ClassComponentSpec<any>)
  }
  if (elemTypeType === "function") {
    return renderFunctionComponent(parent, element as FCSpec<any>)
  }
  error("Unknown element spec: " + serpent.block(element))
}

function renderElement(parent: LuaGuiElement, spec: ElementSpec): ElementInstance {
  const guiSpec: Record<string, any> = {}
  const elemProps = new LuaTable<string | [string], unknown>()
  const events: ElementInstance["events"] = {}

  // eslint-disable-next-line prefer-const
  for (let [key, value] of pairs(spec)) {
    const propProperties = propTypes[key]
    if (!propProperties) continue
    if (typeof value === "function") value = funcRef(value) as any
    if (propProperties === "event") {
      if (!isCallable(value)) error("Gui event handlers must be a function")
      events[key as GuiEventName] = value as unknown as GuiEventHandler
      continue
    }
    const isSpecProp = propProperties[0]
    const isElemProp: string | boolean | null = propProperties[1]
    const event = propProperties[2] as GuiEventName | null
    if (!isSpecProp || isObservable(value)) {
      if (!isElemProp) error(`${key} cannot be a source value`)
      if (typeof isElemProp === "string") elemProps.set([isElemProp], value)
      else elemProps.set(key, value)
      if (event) {
        events[event] = bind(notifySink, {
          key,
          state: value as State<any>,
        })
      }
    } else if (isSpecProp) {
      guiSpec[key] = value
    }
  }

  const nativeElement = parent.add(guiSpec as GuiSpec)
  const instance: ElementInstance = {
    nativeElement,
    valid: true,
    subscriptions: {},
    playerIndex: nativeElement.player_index,
    index: nativeElement.index,
    events,
  }
  Elements[nativeElement.player_index][nativeElement.index] = instance

  for (const [key, value] of pairs(elemProps)) {
    if (isObservable(value)) {
      let observer: Observer<unknown>["next"]
      let name: string
      if (typeof key !== "object") {
        observer = bind(setValueSink, {
          instance,
          element: nativeElement,
          key,
        })
        name = key
      } else {
        name = key[0]
        if (name === "slider_minimum") {
          observer = bind(setSliderMinSink, {
            instance,
            element: nativeElement as SliderGuiElement,
          })
        } else if (name === "slider_maximum") {
          observer = bind(setSliderMaxSink, {
            instance,
            element: nativeElement as SliderGuiElement,
          })
        } else {
          observer = bind(callMethodSink, {
            instance,
            element: nativeElement as any,
            key: name,
          })
        }
      }
      instance.subscriptions[name] = value.subscribe({
        next: observer,
        end: bind(removeSubscription, {
          instance,
          key: name,
        }),
      })
    } else if (typeof key !== "object") {
      // simple value
      ;(nativeElement as any)[key] = value
    } else {
      // setter value
      ;((nativeElement as any)[key[0]] as (this: void, value: unknown) => void)(value)
    }
  }

  const styleMod = spec.styleMod
  if (styleMod) {
    const style = nativeElement.style
    for (const [key, value] of pairs(styleMod)) {
      if (isObservable(value)) {
        instance.subscriptions[key] = value.subscribe({
          next: bind(setValueSink, {
            instance,
            element: style,
            key,
          }),
          end: bind(removeSubscription, {
            instance,
            key,
          }),
        })
      } else {
        ;(style as any)[key] = value
      }
    }
  }

  const children = spec.children
  if (children) {
    instance.children = children.map((childSpec) => renderInternal(nativeElement, childSpec))
  }

  spec.onCreate?.(nativeElement as any)

  return instance
}

function renderFunctionComponent<T>(parent: LuaGuiElement, spec: FCSpec<T>) {
  return renderInternal(parent, spec.type(spec.props))
}

function renderClassComponent<T>(parent: LuaGuiElement, spec: ClassComponentSpec<T>) {
  const instance = new spec.type()
  instance.props = spec.props
  return renderInternal(parent, instance.render())
}

export function render<T extends GuiElementType>(
  parent: LuaGuiElement,
  spec: ElementSpec & { type: T },
): Extract<LuaGuiElement, { type: T }>
export function render(parent: LuaGuiElement, element: Spec): LuaGuiElement
export function render(parent: LuaGuiElement, element: Spec): LuaGuiElement {
  return renderInternal(parent, element).nativeElement as LuaGuiElement
}

function destroyPlainElement(element: BaseGuiElement, deep: boolean | undefined) {
  if (deep) {
    for (const child of (element as LuaGuiElement).children) {
      destroy(child, deep)
    }
  }
  ;(element as LuaGuiElement).destroy()
}

export function destroy(element: ElementInstance | BaseGuiElement | undefined, deep?: boolean): void {
  if (!element || !element.valid) return
  if (rawget(element as any, "__self")) {
    // is lua gui element
    const instance = getInstance(element as LuaGuiElement)
    if (!instance) {
      destroyPlainElement(element as BaseGuiElement, deep)
      return
    }
    element = instance
  }
  const internalInstance = element as ElementInstance
  internalInstance.valid = false
  const { nativeElement, subscriptions, children, playerIndex, index } = internalInstance
  if (children) {
    for (const child of children) {
      destroy(child, deep)
    }
  } else if (deep) {
    for (const child of nativeElement.children) {
      destroy(child, deep)
    }
  }
  for (const [, subscription] of pairs(shallowCopy(subscriptions))) {
    subscription.unsubscribe()
  }
  if (nativeElement.valid) nativeElement.destroy()
  Elements[playerIndex][index] = undefined!
}

function getInstance(element: BaseGuiElement): ElementInstance | undefined {
  if (!element.valid) return undefined
  return Elements[element.player_index][element.index]
}

// -- gui events --
const guiEventNames: Record<GuiEventName, true> = {
  on_gui_click: true,
  on_gui_opened: true,
  on_gui_closed: true,
  on_gui_checked_state_changed: true,
  on_gui_selected_tab_changed: true,
  on_gui_elem_changed: true,
  on_gui_value_changed: true,
  on_gui_selection_state_changed: true,
  on_gui_switch_state_changed: true,
  on_gui_location_changed: true,
  on_gui_confirmed: true,
  on_gui_text_changed: true,
}

const _getInstance = getInstance
for (const [name] of pairs(guiEventNames)) {
  const id = defines.events[name]
  Events.on(id, (e) => {
    const element = e.element
    if (!element) return
    const instance = _getInstance(element) as ElementInstance | undefined
    if (!instance) return
    const event = instance.events[name]
    if (event) callWithoutSelf(event, e)
  })
}
