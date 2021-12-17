import { ElementSpec } from "./ElementSpec"
import propTypes from "./propTypes"
import { bind, Func, Functions } from "../references"
import { CallbagMsg, Source, Talkback } from "../callbags"
import { shallowCopy } from "../_util"

export interface ElementInstance {
  readonly nativeElement: LuaGuiElement
  readonly _elementInstanceBrand: any
}

interface ElementInstanceInternal extends ElementInstance {
  readonly talkbacks: Record<string, Talkback>
}

function setValueSink(
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
  } else if (type === 1) {
    const element = instance.nativeElement
    if (!element.valid) {
      destroy(this.instance)
      return
    }
    ;(element as any)[this.key] = data
  } else if (type === 2) {
    instance.talkbacks[this.key] = undefined!
  }
}

Functions.register({ setSink: setValueSink })

export function create(parent: LuaGuiElement, spec: ElementSpec): ElementInstanceInternal {
  const guiSpec: Record<string, any> = {}
  const toSetOnElem: Record<string, unknown> = {}

  const type = spec.type
  const props = propTypes[type] ?? error("Unknown type " + type)
  for (const [key, value] of pairs(spec)) {
    const propProperties = props[key]
    const specProp = propProperties[0]
    const elemProp = propProperties[1]
    if (!specProp || value instanceof Func) {
      if (!elemProp) error(`${key} cannot be a source/value`)
      toSetOnElem[elemProp] = value
    } else if (specProp) {
      guiSpec[specProp] = value
    }
  }
  const nativeElement = parent.add(guiSpec as GuiSpec)
  const instance: ElementInstanceInternal = {
    nativeElement,
    talkbacks: {},
    _elementInstanceBrand: undefined,
  }

  for (const [key, value] of pairs(toSetOnElem)) {
    if (value instanceof Func) {
      if (!getmetatable(value)?.__call) {
        error("Non-callbag class given to key " + key)
      }
      ;(value as Source<any>)(0, bind(setValueSink, { instance, key }))
    } else {
      ;(nativeElement as any)[key] = value
    }
  }

  return instance
}

export function destroy(element: ElementInstance): void {
  const instance = element as ElementInstanceInternal
  if (!instance.nativeElement.valid) error("already destroyed instance")
  instance.nativeElement.destroy()
  for (const [, talkback] of pairs(shallowCopy(instance.talkbacks))) {
    talkback(2)
  }
}
