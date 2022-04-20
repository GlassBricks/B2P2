import { ComponentClass, Element, ElementSpec, FunctionComponent } from "./spec"
import { BaseElementSpec } from "./spec-types"

const _select = select

function flattenChildren(
  ...children: Array<false | undefined | ElementSpec | Array<false | undefined | ElementSpec>>
): ElementSpec[] | undefined {
  const childrenLen = _select("#", ...children)
  if (childrenLen === 0) return undefined
  const result: ElementSpec[] = []
  const array = [...children]
  for (const i of $range(1, childrenLen)) {
    const child = array[i - 1]
    if (child) {
      if (Array.isArray(child)) {
        for (const childElement of child) {
          if (childElement) result[result.length] = childElement
        }
      } else {
        result[result.length] = child
      }
    }
  }
  return result
}

const _type = type
export default function createElement(
  this: unknown,
  type: string | FunctionComponent<any> | ComponentClass<any>,
  props?: unknown,
  ...children: any[]
): Element {
  const flattenedChildren = flattenChildren(...children)
  const typeofType = _type(type)
  if (typeofType === "string") {
    const result = (props || {}) as BaseElementSpec
    result.type = type as GuiElementType
    result.children = flattenedChildren
    return result as ElementSpec
  }
  props ||= {}
  ;(props as any).children = flattenedChildren
  return {
    type: type as FunctionComponent<any> | ComponentClass<any>,
    props,
  }
}
