import { ElementSpec } from "./types"
import * as propTypes from "./propTypes.json"
import { bind, Func, funcRef, Functions } from "../references"
import { CallbagMsg, Source, Talkback } from "../callbags"
import { shallowCopy } from "../_util"

export interface ElementInstance<T extends GuiElementType> {
  readonly nativeElement: Extract<LuaGuiElement, { type: T }>
  readonly _elementInstanceBrand: any
}

interface ElementInstanceInternal extends ElementInstance<any> {
  readonly talkbacks: Record<string, Talkback>
  children?: ElementInstanceInternal[]
}

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

Functions.register({ setValueSink, callMethodSink, setSliderMinMaxSink })

export function create<T extends GuiElementType>(
  parent: LuaGuiElement,
  spec: ElementSpec & { type: T },
): ElementInstance<T> {
  const guiSpec: Record<string, any> = {}
  const toSetOnElem = new LuaTable<string | [string], unknown>()
  const styleMod = spec.styleMod

  // eslint-disable-next-line prefer-const
  for (let [key, value] of pairs(spec)) {
    if (key === "children" || key === "styleMod") continue
    const propProperties = propTypes[key]
    const specProp = propProperties[0]
    const elemProp = propProperties[1]
    if (typeof value === "function") value = funcRef(value)
    if (!specProp || value instanceof Func) {
      if (!elemProp) error(`${key} cannot be a source/value`)
      toSetOnElem.set(elemProp, value)
    } else if (specProp) {
      guiSpec[specProp] = value
    }
  }
  const nativeElement = parent.add(guiSpec as GuiSpec)
  const style = nativeElement.style
  const instance: ElementInstanceInternal = {
    nativeElement,
    talkbacks: {},
    _elementInstanceBrand: undefined,
  }

  for (const [key, value] of pairs(toSetOnElem)) {
    if (value instanceof Func) {
      if (typeof key !== "object") {
        ;(value as Source<unknown>)(0, bind(setValueSink, { instance, key, value: nativeElement }))
        continue
      }
      const method = key[0]
      if (method === "slider_minimum" || method === "slider_maximum") {
        ;(value as Source<unknown>)(
          0,
          bind(setSliderMinMaxSink, {
            instance,
            key: method as "slider_minimum" | "slider_maximum",
          }),
        )
      } else {
        ;(value as Source<unknown>)(0, bind(callMethodSink, { instance, key: method }))
      }
    } else if (typeof key === "object") {
      ;((nativeElement as any)[key[0]] as (this: void, value: unknown) => void)(value)
    } else {
      ;(nativeElement as any)[key] = value
    }
  }

  if (styleMod) {
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

  return instance as ElementInstance<any>
}

export function destroy(element: ElementInstance<any>): void {
  const { nativeElement, talkbacks, children } = element as ElementInstanceInternal
  if (children) {
    children.forEach((child) => destroy(child))
  }
  for (const [, talkback] of pairs(shallowCopy(talkbacks))) {
    talkback(2)
  }
  if (nativeElement.valid) nativeElement.destroy()
}
