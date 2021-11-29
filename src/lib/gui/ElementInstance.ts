// Properties:
// readonly
// writeable
// bindable
// lua style

// creation:
// write-only <-> (kinda) readonly
// add to creationSpec vs modify element
// value, observable, property <-> writeable, bindable
// lua style -- use writeable only

// other:
// events
// some events are special

import { ChangeListener, ChangeListenerClass, getValue, ObservableValue } from "../value"
import { ClassRegisterer, objAsFunc, RegisteredClass } from "../references"
import { addOnlyProps, addProps, commonAddProps, SpecProps } from "./types"

const registerClass = ClassRegisterer("gui:")

@registerClass()
export class ElementInstance extends RegisteredClass {
  private element: LuaGuiElement | undefined
  private refs = new LuaTable<ChangeListener<unknown>, true>()

  constructor(parent: LuaGuiElement, p: SpecProps<GuiElementType>) {
    super()
    const type: GuiElementType = p.type
    const props = p as Record<string, unknown>
    for (const [k] of pairs(addOnlyProps[type])) {
      if ((props[k] as unknown) instanceof ObservableValue) {
        error(`The property ${k} cannot be an observable value for gui element of type ${type}`)
      }
    }

    const addSpec: Record<string, unknown> = {}
    for (const [k] of pairs(addProps[type])) {
      addSpec[k] = getValue(props[k])
    }
    for (const [k] of pairs(commonAddProps)) {
      addSpec[k] = getValue(props[k])
    }
    const element = parent.add(addSpec as unknown as GuiSpec)
    this.element = element

    for (const [k, v] of pairs(props)) {
      if (!(k in addProps || k in commonAddProps)) {
        ;(element as any)[k] = getValue(v)
      }
      if (v instanceof ObservableValue) {
        const listener = objAsFunc(new GuiUpdateListener(element, k as string))
        this.refs.set(listener, true)
        v.addListener(listener, true)
      }
    }
  }

  destroy(): void {
    if (!this.element) return
    this.element.destroy()
    this.refs = new LuaTable()
    this.element = undefined
    // todo: destroy children
  }
}

@registerClass()
class GuiUpdateListener extends RegisteredClass implements ChangeListenerClass<unknown> {
  constructor(private element: LuaGuiElement, private property: string) {
    super()
  }

  __call(_: unknown, value: ObservableValue<unknown>): void {
    const element = this.element
    if (element.valid) {
      ;(element as Record<string, unknown>)[this.property] = value.get()
    }
  }
}
