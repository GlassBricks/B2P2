// noinspection JSUnusedGlobalSymbols

import { ElementSpec } from "./element-specs"

export * from "./element-specs"

export type FunctionComponent<T> = (props: T) => Spec

export abstract class Component {
  abstract render(props: unknown): Spec
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  declare _props: Parameters<this["render"]>[0]
}

export abstract class EmptyComponent {
  abstract render(): Spec
  // eslint-disable-next-line @typescript-eslint/ban-types
  declare _props: {}
}

export interface ComponentClass<P> {
  name: string
  new (): Component & {
    _props?: P
  }
}

export interface FCSpec<T> {
  type: FunctionComponent<T>
  props: T
}

export interface ClassComponentSpec<T> {
  type: ComponentClass<T>
  props: T
}

export interface FragmentSpec {
  type: "fragment"
  children?: Spec[]
}

export type Spec = ElementSpec | FCSpec<any> | ClassComponentSpec<any>
export type FullSpec = Spec | FragmentSpec
export type SpecChildren = Spec | false | undefined | Array<Spec | false | undefined>

export type GuiEvent =
  | OnGuiCheckedStateChangedEvent
  | OnGuiClosedEvent
  | OnGuiClickEvent
  | OnGuiConfirmedEvent
  | OnGuiElemChangedEvent
  | OnGuiLocationChangedEvent
  | OnGuiOpenedEvent
  | OnGuiSelectedTabChangedEvent
  | OnGuiSelectionStateChangedEvent
  | OnGuiSwitchStateChangedEvent
  | OnGuiTextChangedEvent
  | OnGuiValueChangedEvent

export type GuiEventHandler<T extends GuiEvent = GuiEvent> = (event: T) => void
export type CheckedStateChangedEventHandler = GuiEventHandler<OnGuiCheckedStateChangedEvent>
export type ClosedEventHandler = GuiEventHandler<OnGuiClosedEvent>
export type ClickEventHandler = GuiEventHandler<OnGuiClickEvent>
export type ConfirmedEventHandler = GuiEventHandler<OnGuiConfirmedEvent>
export type ElemChangedEventHandler = GuiEventHandler<OnGuiElemChangedEvent>
export type LocationChangedEventHandler = GuiEventHandler<OnGuiLocationChangedEvent>
export type OpenedEventHandler = GuiEventHandler<OnGuiOpenedEvent>
export type SelectedTabChangedEventHandler = GuiEventHandler<OnGuiSelectedTabChangedEvent>
export type SelectionStateChangedEventHandler = GuiEventHandler<OnGuiSelectionStateChangedEvent>
export type SwitchStateChangedEventHandler = GuiEventHandler<OnGuiSwitchStateChangedEvent>
export type TextChangedEventHandler = GuiEventHandler<OnGuiTextChangedEvent>
export type ValueChangedEventHandler = GuiEventHandler<OnGuiValueChangedEvent>
