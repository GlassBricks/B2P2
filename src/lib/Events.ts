/** @noSelfInFile */

import { PRecord } from "./util-types"

export interface ScriptEvents {
  on_init: undefined
  on_load: undefined
  on_configuration_changed: ConfigurationChangedData
}

export type NamedEventTypes = {
  [E in keyof typeof defines.events]: typeof defines.events[E]["_eventData"]
} & ScriptEvents

export type EventHandlers = {
  [E in keyof NamedEventTypes]?: (data: NamedEventTypes[E]) => void
}

type EventDataOf<T extends EventId<any, any> | string> = T extends EventId<any, any>
  ? T["_eventData"]
  : T extends string
  ? CustomInputEvent
  : never

type ShorthandRegister = {
  -readonly [E in keyof NamedEventTypes]: (handler: (data: NamedEventTypes[E]) => void) => void
}

/** @noSelf */
export interface EventsObj extends ShorthandRegister {
  /**
   * Registers an event handler by id only. This can be called multiple times, and the event handlers will be called in
   * the order that they are registered.
   */
  on<E extends EventId<any, any>>(event: E | E[], f: (data: E["_eventData"]) => void): void
  on<E extends string>(event: E | E[], f: (data: CustomInputEvent) => void): void
  on<E extends EventId<any, any> | string>(event: E | E[], f: (data: EventDataOf<E>) => void): void
  /**
   * Registers multiple event handlers by name. Only game and script events can be registered here by name. For custom
   * events/input events, use `register` instead.
   *
   * @param handlers A table of event name -> event handler function
   */
  onAll(handlers: EventHandlers): void

  clearHandlers<E extends EventId<any, any> | string>(event: E): void
}

const scriptEvents: Record<keyof ScriptEvents, symbol> = {
  on_init: Symbol("on_init"),
  on_load: Symbol("on_load"),
  on_configuration_changed: Symbol("on_configuration_changed"),
}
type AnyHandler = (data?: any) => void

// number -- event id
// string -- custom input handler
// symbol -- script event
const registeredHandlers: PRecord<keyof any, AnyHandler[]> = {}

function registerInternal(id: keyof any, handler: AnyHandler) {
  let handlers = registeredHandlers[id]
  if (!handlers) {
    handlers = registeredHandlers[id] = []
  }
  handlers.push(handler)
  if (handlers.length > 2) return

  let func
  if (handlers.length === 1) {
    func = handler
  } else {
    const theHandlers = handlers
    func = (data: any) => {
      for (const i of $range(1, theHandlers.length)) {
        theHandlers[i - 1](data)
      }
    }
  }
  if (type(id) === "table") {
    script[(id as symbol).description as keyof ScriptEvents](func)
  } else {
    script.on_event(id as any, func)
  }
}

function clear(id: keyof any) {
  registeredHandlers[id] = undefined
  if (type(id) === "table") {
    script[(id as symbol).description as keyof ScriptEvents](undefined)
  } else {
    script.on_event(id as any, undefined)
  }
}

const Events = {
  on<E extends EventId<any, any> | string>(event: E | E[], func: AnyHandler): void {
    if (!Array.isArray(event)) {
      registerInternal(event, func)
    } else {
      for (const e of event) {
        registerInternal(e, func)
      }
    }
  },
  onAll(handlers: EventHandlers): void {
    for (const [event, handler] of pairs(handlers)) {
      const id =
        scriptEvents[event as keyof ScriptEvents] ??
        defines.events[event as keyof typeof defines.events] ??
        error(`"${event}" is not an event name. Use "register" to register a handler for a custom input event.`)
      registerInternal(id, handler)
    }
  },
  clearHandlers: clear,
} as EventsObj

for (const [name, id] of pairs(defines.events)) {
  Events[name] = (handler: AnyHandler) => {
    registerInternal(id, handler)
  }
}
for (const [name, id] of pairs(scriptEvents)) {
  Events[name] = (handler: AnyHandler) => {
    registerInternal(id, handler)
  }
}
export default Events
