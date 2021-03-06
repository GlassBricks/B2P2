// noinspection JSUnusedGlobalSymbols

import { Callback, Func } from "../references"
import { ElementSpec } from "./element-specs"

export * from "./element-specs"

/** @noSelf */
export interface Tracker {
  /**
   * This does not have to be a registered func.
   */
  onMount(callback: (this: unknown, firstElement: LuaGuiElement) => void): void
  /**
   * As this function will be stored, only registered funcs can be added.
   */
  onDestroy(callback: Callback): void
}

export type FunctionComponent<T> = (props: T, tracker: Tracker) => Spec

export abstract class Component<P> {
  abstract render(props: P, tracker: Tracker): Spec
  declare _props: P

  onMount?(firstElement: LuaGuiElement, tracker: Tracker): void
  onDestroy?(): void
}

export type EmptyProps = Record<any, never>

export interface ComponentClass<P> {
  name: string
  new (): Component<P>
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

export type Spec = ElementSpec | FragmentSpec | FCSpec<any> | ClassComponentSpec<any>
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

export type GuiEventHandler<T extends GuiEvent = GuiEvent> = Func<(event: T) => void>
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

export type OnCreateHandler<T extends BaseGuiElement> = (this: unknown, element: T) => void
