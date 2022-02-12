import { ElementSpec } from "./spec-types"

export { ElementSpec }

export type FunctionComponent<T> = (props: T) => ElementSpec

export abstract class Component<T> {
  declare props: T
  abstract render(): Element
}

export interface ComponentClass<T> {
  name: string
  prototype: Component<T>
  new (): Component<T>
}

export interface FCSpec<T> {
  type: FunctionComponent<T>
  props: T
}

export interface ClassComponentSpec<T> {
  type: ComponentClass<T>
  props: T
}

export type Element = ElementSpec | FCSpec<any> | ClassComponentSpec<any>