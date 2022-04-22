/* eslint-disable @typescript-eslint/ban-types */
import _createElement from "./createElement"
import "./render"
import {
  ButtonElementSpec,
  CameraElementSpec,
  CheckboxElementSpec,
  ChooseElemButtonElementSpec,
  DropDownElementSpec,
  ElementSpec,
  EmptyWidgetElementSpec,
  EntityPreviewElementSpec,
  FlowElementSpec,
  FrameElementSpec,
  LabelElementSpec,
  LineElementSpec,
  ListBoxElementSpec,
  MinimapElementSpec,
  ProgressBarElementSpec,
  RadioButtonElementSpec,
  ScrollPaneElementSpec,
  SliderElementSpec,
  Spec,
  Spec as _Element,
  SpriteButtonElementSpec,
  SwitchElementSpec,
  TabElementSpec,
  TextBoxElementSpec,
  TextFieldElementSpec,
} from "./spec"

export * from "./spec"
export * from "./render"

export namespace FactorioJsx {
  type IntrinsicElement<T extends ElementSpec> = Omit<T, "type" | "children"> & {
    children?: false | Spec | (false | Spec | ElementSpec[])[]
  }
  export const createElement = _createElement
  export namespace JSX {
    export type Element = _Element

    export interface ElementAttributesProperty {
      props: {}
    }
    export interface ElementChildrenAttribute {
      children: {}
    }

    export interface IntrinsicElements {
      "choose-elem-button": IntrinsicElement<ChooseElemButtonElementSpec>
      "drop-down": IntrinsicElement<DropDownElementSpec>
      "empty-widget": IntrinsicElement<EmptyWidgetElementSpec>
      "entity-preview": IntrinsicElement<EntityPreviewElementSpec>
      "list-box": IntrinsicElement<ListBoxElementSpec>
      "scroll-pane": IntrinsicElement<ScrollPaneElementSpec>
      "sprite-button": IntrinsicElement<SpriteButtonElementSpec>
      "tabbed-pane": IntrinsicElement<TextBoxElementSpec>
      "text-box": IntrinsicElement<TextBoxElementSpec>
      button: IntrinsicElement<ButtonElementSpec>
      camera: IntrinsicElement<CameraElementSpec>
      checkbox: IntrinsicElement<CheckboxElementSpec>
      flow: IntrinsicElement<FlowElementSpec>
      frame: IntrinsicElement<FrameElementSpec>
      label: IntrinsicElement<LabelElementSpec>
      line: IntrinsicElement<LineElementSpec>
      minimap: IntrinsicElement<MinimapElementSpec>
      progressbar: IntrinsicElement<ProgressBarElementSpec>
      radiobutton: IntrinsicElement<RadioButtonElementSpec>
      slider: IntrinsicElement<SliderElementSpec>
      sprite: IntrinsicElement<SpriteButtonElementSpec>
      switch: IntrinsicElement<SwitchElementSpec>
      tab: IntrinsicElement<TabElementSpec>
      table: IntrinsicElement<TabElementSpec>
      textfield: IntrinsicElement<TextFieldElementSpec>
    }
  }
}
