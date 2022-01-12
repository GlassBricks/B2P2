import { ElementSpec } from "./spec-types"
import * as propTypes from "./propTypes.json"
import { bind, Func, funcRef, Functions } from "../references"
import { CallbagMsg, SinkSource, Source, Talkback } from "../callbags"
import { shallowCopy } from "../_util"
import { PlayerData } from "../player-data"
import { GuiEventName } from "./gui-event-types"
import { PRecord } from "../util-types"
import Events from "../Events"

export interface ElementInstance<T extends GuiElementType> {
  readonly nativeElement: Extract<GuiElementMembers, { type: T }>
  readonly playerIndex: number
  readonly index: number
  readonly valid: boolean
}

interface ElementInstanceInternal extends ElementInstance<any> {
  readonly talkbacks: Record<string, Talkback>
  children?: ElementInstanceInternal[]
  valid: boolean
  events: PRecord<GuiEventName, Func<any>>
}

// sinks
function setValueSink(
  this: {
    readonly instance: ElementInstanceInternal
    readonly value: { readonly valid: boolean }
    readonly key: string
  },
  type: CallbagMsg,
  data?: unknown,
) {
  if (type === 0) {
    this.instance.talkbacks[this.key] = data as Talkback
    ;(data as Talkback)(1)
  } else if (type === 1) {
    const element = this.value
    if (!element.valid) {
      destroy(this.instance)
      return
    }
    ;(element as any)[this.key] = data
  } else if (type === 2) {
    this.instance.talkbacks[this.key] = undefined!
  }
}

function callMethodSink(
  this: {
    readonly instance: ElementInstanceInternal
    readonly key: string
  },
  type: CallbagMsg,
  data?: unknown,
) {
  const instance = this.instance
  if (type === 0) {
    instance.talkbacks[this.key] = data as Talkback
    ;(data as Talkback)(1)
  } else if (type === 1) {
    const element = instance.nativeElement
    if (!element.valid) {
      destroy(this.instance)
      return
    }
    ;((element as any)[this.key] as (this: void, value: unknown) => void)(data)
  } else if (type === 2) {
    instance.talkbacks[this.key] = undefined!
  }
}

function setSliderMinMaxSink(
  this: {
    readonly instance: ElementInstanceInternal
    readonly key: "slider_minimum" | "slider_maximum"
  },
  type: CallbagMsg,
  data?: unknown,
) {
  const instance = this.instance
  if (type === 0) {
    instance.talkbacks[this.key] = data as Talkback
    ;(data as Talkback)(1)
  } else if (type === 1) {
    const element = instance.nativeElement as SliderGuiElementMembers
    if (!element.valid) {
      destroy(this.instance)
      return
    }
    if (this.key === "slider_minimum") {
      element.set_slider_minimum_maximum(data as number, element.get_slider_maximum())
    } else {
      element.set_slider_minimum_maximum(element.get_slider_minimum(), data as number)
    }
  } else if (type === 2) {
    instance.talkbacks[this.key] = undefined!
  }
}

function notifySink(this: { key: string; state: SinkSource<unknown> }, event: { element: LuaGuiElement }) {
  const key = this.key
  this.state(1, (event as any)[key] || event.element[key])
}

Functions.register({ setValueSink, callMethodSink, setSliderMinMaxSink, notifySink })

type GuiUnitNumber = number
const Elements = PlayerData<Record<GuiUnitNumber, ElementInstanceInternal>>("gui:Elements", () => ({}))

export function create<T extends GuiElementType>(
  parent: LuaGuiElement,
  spec: ElementSpec & { type: T },
): ElementInstance<T> {
  const guiSpec: Record<string, any> = {}
  const elemProps = new LuaTable<string | [string], unknown>()
  const events: ElementInstanceInternal["events"] = {}

  // eslint-disable-next-line prefer-const
  for (let [key, value] of pairs(spec)) {
    if (typeof value === "function") value = funcRef(value)
    const propProperties = propTypes[key]
    if (!propProperties) continue
    if (propProperties === "event") {
      if (!(value instanceof Func)) error("Gui event handlers must be a function")
      events[key as GuiEventName] = value
      continue
    }
    const isSpecProp = propProperties[0]
    const isElemProp: string | boolean | null = propProperties[1]
    const event = propProperties[2] as GuiEventName | null
    if (!isSpecProp || value instanceof Func) {
      if (!isElemProp) error(`${key} cannot be a source value`)
      if (typeof isElemProp === "string") elemProps.set([isElemProp], value)
      else elemProps.set(key, value)
      if (event) {
        events[event] = bind(notifySink, {
          key,
          state: value as SinkSource<unknown>,
        })
      }
    } else if (isSpecProp) {
      guiSpec[key] = value
    }
  }

  const nativeElement = parent.add(guiSpec as GuiSpec)
  const instance: ElementInstanceInternal = {
    nativeElement,
    valid: true,
    talkbacks: {},
    playerIndex: nativeElement.player_index,
    index: nativeElement.index,
    events,
  }
  Elements[nativeElement.player_index][nativeElement.index] = instance

  for (const [key, value] of pairs(elemProps)) {
    if (value instanceof Func) {
      if (typeof key !== "object") {
        // simple source
        ;(value as Source<unknown>)(0, bind(setValueSink, { instance, key, value: nativeElement }))
        continue
      }
      const method = key[0]
      if (method === "slider_minimum" || method === "slider_maximum") {
        // slider min max source
        ;(value as Source<unknown>)(
          0,
          bind(setSliderMinMaxSink, {
            instance,
            key: method as "slider_minimum" | "slider_maximum",
          }),
        )
      } else {
        // setter source
        ;(value as Source<unknown>)(0, bind(callMethodSink, { instance, key: method }))
      }
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
      if (value instanceof Func) {
        ;(value as Source<unknown>)(0, bind(setValueSink, { instance, key, value: style }))
      } else {
        ;(style as any)[key] = value as never
      }
    }
  }

  const children = spec.children
  if (children) {
    instance.children = children.map((childSpec) => create(nativeElement, childSpec) as ElementInstanceInternal)
  }

  spec.onCreate?.(nativeElement as any)

  return instance as ElementInstance<any>
}

export function destroy(element: ElementInstance<any> | GuiElementMembers): void {
  if (!element.valid) return
  if (rawget(element as any, "__self")) {
    // is lua gui element
    const instance = getInstance(element as LuaGuiElement)
    if (!instance) {
      ;(element as LuaGuiElement).destroy()
      return
    }
    element = instance
  }
  const internalInstance = element as ElementInstanceInternal
  internalInstance.valid = false
  const { nativeElement, talkbacks, children, playerIndex, index } = internalInstance
  if (children) {
    for (const child of children) {
      destroy(child)
    }
  }
  for (const [, talkback] of pairs(shallowCopy(talkbacks))) {
    talkback(2)
  }
  if (nativeElement.valid) nativeElement.destroy()
  Elements[playerIndex][index] = undefined!
}

export function getInstance<T extends GuiElementType>(
  element: GuiElementMembers & { type: T },
): ElementInstance<T> | undefined {
  if (!element.valid) return undefined
  return Elements[element.player_index][element.index] as ElementInstance<any> | undefined
}

// -- gui events --
type GuiEventId = typeof defines.events[GuiEventName]

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
const guiEventNameMapping: Record<GuiEventId, GuiEventName> = {}
for (const [guiEventName] of pairs(guiEventNames)) {
  guiEventNameMapping[defines.events[guiEventName]] = guiEventName
}

const _getInstance = getInstance
for (const [id, name] of pairs(guiEventNameMapping)) {
  Events.on(id, (e) => {
    const element = e.element
    if (!element) return
    ;(_getInstance(element) as ElementInstanceInternal)?.events[name]?.(e)
  })
}
