import { ComponentClass, Element, ElementSpec, FunctionComponent } from "./spec"
import { BaseElementSpec } from "./spec-types"

function flattenChildren(
  children: false | undefined | ElementSpec | (false | undefined | ElementSpec | ElementSpec[])[],
): ElementSpec[] | undefined {
  if (!children) return undefined
  if (!Array.isArray(children)) return [children]
  const result: ElementSpec[] = []
  for (const child of children) {
    if (!child) continue
    if (Array.isArray(child)) {
      for (const childElement of child) {
        if (childElement) result[result.length] = childElement
      }
    } else {
      result[result.length] = child
    }
  }
  return result
}

const _type = type
export default function createElement(
  this: unknown,
  type: string | FunctionComponent<any> | ComponentClass<any>,
  props?: unknown,
  children?: unknown,
): Element {
  const typeofType = _type(type)
  if (typeofType === "string") {
    const result = (props || {}) as BaseElementSpec
    result.type = type as GuiElementType
    result.children = flattenChildren(children as any)
    return result as ElementSpec
  }
  props ||= {}
  if (children) {
    ;(props as any).children = children
  }
  return {
    type: type as FunctionComponent<any> | ComponentClass<any>,
    props,
  }
}
