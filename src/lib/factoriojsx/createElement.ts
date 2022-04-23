import { BaseElementSpec, ComponentClass, ElementSpec, FunctionComponent, Spec } from "./spec"

const _select = select

function flattenChildren(
  ...children:
    | Array<false | undefined | ElementSpec>
    | [ElementSpec | false | undefined | Array<ElementSpec | undefined>]
): ElementSpec[] | undefined {
  let childrenLen = _select("#", ...children)
  if (childrenLen === 0) return undefined
  let childArray: any[]
  if (childrenLen === 1) {
    // either single element, or single array
    const [child] = children
    if (!child) return undefined
    if (Array.isArray(child)) {
      childArray = child
      const n = (childArray as any).n
      childrenLen = typeof n === "number" ? n : childArray.length
    } else {
      return [child]
    }
  } else {
    childArray = [...children]
  }

  const result: ElementSpec[] = []
  let len = 1
  for (const i of $range(1, childrenLen)) {
    const child = childArray[i - 1]
    if (child) {
      result[len - 1] = child
      len++
    }
  }
  return result
}

function flattenChildrenToProp(
  ...children: Array<false | undefined | ElementSpec | Array<false | undefined | ElementSpec>>
): unknown {
  const childrenLen = _select("#", ...children)
  if (childrenLen <= 1) {
    const [child] = children
    return child
  }
  const result = [...children] as any
  result.n = childrenLen
  return result
}

const _type = type
export default function createElement(
  this: unknown,
  type: string | FunctionComponent<any> | ComponentClass<any>,
  props?: unknown,
  ...children: any[]
): Spec {
  const typeofType = _type(type)
  if (typeofType === "string") {
    const result = (props || {}) as BaseElementSpec
    result.type = type as GuiElementType
    result.children = flattenChildren(...children)
    return result as ElementSpec
  }
  props ||= {}
  ;(props as any).children ??= flattenChildrenToProp(...children)
  return {
    type: type as FunctionComponent<any> | ComponentClass<any>,
    props,
  }
}
