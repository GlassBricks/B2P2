// This file was auto-generated by scripts/gen-gui-specs.ts. Do not edit directly!

import { MaybeMutableState, MaybeState } from "../observable"
import { GuiEventHandler, OnCreateHandler, Spec } from "./spec"

export interface BaseElementSpec {
  type: GuiElementType
  name?: MaybeState<string>
  caption?: MaybeState<LocalisedString>
  tooltip?: MaybeState<LocalisedString>
  enabled?: MaybeState<boolean>
  visible?: MaybeState<boolean>
  ignored_by_interaction?: MaybeState<boolean>
  style?: string
  tags?: Tags
  anchor?: MaybeState<GuiAnchor | undefined>
  location?: MaybeState<GuiLocation | undefined>
  children?: Spec[]
}

export interface ChooseElemButtonElementSpec extends BaseElementSpec {
  type: "choose-elem-button"
  elem_type: ChooseElemButtonType
  elem_filters?: MaybeState<ChooseElemButtonFilters[this["elem_type"]] | undefined>
  elem_value?: MaybeMutableState<(this["elem_type"] extends "signal" ? SignalID : string) | undefined>
  locked?: MaybeState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<ChooseElemButtonGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface DropDownElementSpec extends BaseElementSpec {
  type: "drop-down"
  items?: MaybeState<LocalisedString[]>
  selected_index?: MaybeMutableState<uint>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<DropDownGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface EmptyWidgetElementSpec extends BaseElementSpec {
  type: "empty-widget"
  drag_target?: MaybeState<LuaGuiElement | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<EmptyWidgetGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface EntityPreviewElementSpec extends BaseElementSpec {
  type: "entity-preview"
  entity?: MaybeState<LuaEntity | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<EntityPreviewGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface ListBoxElementSpec extends BaseElementSpec {
  type: "list-box"
  items?: MaybeState<LocalisedString[]>
  selected_index?: MaybeMutableState<uint>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<ListBoxGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface ScrollPaneElementSpec extends BaseElementSpec {
  type: "scroll-pane"
  horizontal_scroll_policy?: MaybeState<
    "auto" | "never" | "always" | "auto-and-reserve-space" | "dont-show-but-allow-scrolling"
  >
  vertical_scroll_policy?: MaybeState<
    "auto" | "never" | "always" | "auto-and-reserve-space" | "dont-show-but-allow-scrolling"
  >
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<ScrollPaneGuiElementMembers>
  styleMod?: ScrollPaneStyleMod
}

export interface SpriteButtonElementSpec extends BaseElementSpec {
  type: "sprite-button"
  sprite?: MaybeState<SpritePath>
  hovered_sprite?: MaybeState<SpritePath>
  clicked_sprite?: MaybeState<SpritePath>
  number?: MaybeState<double | undefined>
  show_percent_for_small_numbers?: MaybeState<boolean>
  mouse_button_filter?: MaybeState<MouseButtonFlags>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<SpriteButtonGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface TabbedPaneElementSpec extends BaseElementSpec {
  type: "tabbed-pane"
  selected_tab_index?: MaybeMutableState<uint | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<TabbedPaneGuiElementMembers>
  styleMod?: TabbedPaneStyleMod
}

export interface TextBoxElementSpec extends BaseElementSpec {
  type: "text-box"
  text?: MaybeMutableState<string>
  clear_and_focus_on_right_click?: MaybeState<boolean>
  selectable?: MaybeState<boolean>
  word_wrap?: MaybeState<boolean>
  read_only?: MaybeState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_confirmed?: GuiEventHandler<OnGuiConfirmedEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<TextBoxGuiElementMembers>
  styleMod?: TextBoxStyleMod
}

export interface ButtonElementSpec extends BaseElementSpec {
  type: "button"
  mouse_button_filter?: MaybeState<MouseButtonFlags>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<ButtonGuiElementMembers>
  styleMod?: ButtonStyleMod
}

export interface CameraElementSpec extends BaseElementSpec {
  type: "camera"
  position: MaybeState<MapPosition>
  surface_index?: MaybeState<SurfaceIndex>
  zoom?: MaybeState<double>
  entity?: MaybeState<LuaEntity | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<CameraGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface CheckboxElementSpec extends BaseElementSpec {
  type: "checkbox"
  state: MaybeMutableState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<CheckboxGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface FlowElementSpec extends BaseElementSpec {
  type: "flow"
  direction?: "horizontal" | "vertical"
  drag_target?: MaybeState<LuaGuiElement | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<FlowGuiElementMembers>
  styleMod?: FlowStyleMod
}

export interface FrameElementSpec extends BaseElementSpec {
  type: "frame"
  direction?: "horizontal" | "vertical"
  auto_center?: MaybeState<boolean>
  drag_target?: MaybeState<LuaGuiElement | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_location_changed?: GuiEventHandler<OnGuiLocationChangedEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<FrameGuiElementMembers>
  styleMod?: FrameStyleMod
}

export interface LabelElementSpec extends BaseElementSpec {
  type: "label"
  drag_target?: MaybeState<LuaGuiElement | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<LabelGuiElementMembers>
  styleMod?: LabelStyleMod
}

export interface LineElementSpec extends BaseElementSpec {
  type: "line"
  direction?: "horizontal" | "vertical"
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<LineGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface MinimapElementSpec extends BaseElementSpec {
  type: "minimap"
  position?: MaybeState<MapPosition>
  surface_index?: MaybeState<SurfaceIndex>
  chart_player_index?: uint
  force?: MaybeState<string | undefined>
  zoom?: MaybeState<double>
  minimap_player_index?: MaybeState<uint>
  entity?: MaybeState<LuaEntity | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<MinimapGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface ProgressBarElementSpec extends BaseElementSpec {
  type: "progressbar"
  value?: MaybeState<double>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<ProgressBarGuiElementMembers>
  styleMod?: ProgressBarStyleMod
}

export interface RadioButtonElementSpec extends BaseElementSpec {
  type: "radiobutton"
  state: MaybeMutableState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<RadioButtonGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface SliderElementSpec extends BaseElementSpec {
  type: "slider"
  minimum_value?: MaybeState<double>
  maximum_value?: MaybeState<double>
  value_step?: MaybeState<double>
  discrete_slider?: MaybeState<double>
  discrete_values?: boolean
  slider_value?: MaybeMutableState<double>
  discrete_value?: MaybeState<double>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<SliderGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface SpriteElementSpec extends BaseElementSpec {
  type: "sprite"
  sprite?: MaybeState<SpritePath>
  resize_to_sprite?: MaybeState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<SpriteGuiElementMembers>
  styleMod?: SpriteStyleMod
}

export interface SwitchElementSpec extends BaseElementSpec {
  type: "switch"
  switch_state?: MaybeMutableState<string>
  allow_none_state?: MaybeState<boolean>
  left_label_caption?: MaybeState<LocalisedString>
  left_label_tooltip?: MaybeState<LocalisedString>
  right_label_caption?: MaybeState<LocalisedString>
  right_label_tooltip?: MaybeState<LocalisedString>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<SwitchGuiElementMembers>
  styleMod?: BaseStyleMod
}

export interface TabElementSpec extends BaseElementSpec {
  type: "tab"
  badge_text?: MaybeState<LocalisedString>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<TabGuiElementMembers>
  styleMod?: TabStyleMod
}

export interface TableElementSpec extends BaseElementSpec {
  type: "table"
  column_count: uint
  draw_vertical_lines?: MaybeState<boolean>
  draw_horizontal_lines?: MaybeState<boolean>
  draw_horizontal_line_after_headers?: MaybeState<boolean>
  vertical_centering?: MaybeState<boolean>
  drag_target?: MaybeState<LuaGuiElement | undefined>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<TableGuiElementMembers>
  styleMod?: TableStyleMod
}

export interface TextFieldElementSpec extends BaseElementSpec {
  type: "textfield"
  text?: MaybeMutableState<string>
  numeric?: MaybeState<boolean>
  allow_decimal?: MaybeState<boolean>
  allow_negative?: MaybeState<boolean>
  is_password?: MaybeState<boolean>
  lose_focus_on_confirm?: MaybeState<boolean>
  clear_and_focus_on_right_click?: MaybeState<boolean>
  on_gui_click?: GuiEventHandler<OnGuiClickEvent>
  on_gui_confirmed?: GuiEventHandler<OnGuiConfirmedEvent>
  on_gui_opened?: GuiEventHandler<OnGuiOpenedEvent>
  on_gui_closed?: GuiEventHandler<OnGuiClosedEvent>
  onCreate?: OnCreateHandler<TextFieldGuiElementMembers>
  styleMod?: TextFieldStyleMod
}

export type ElementSpec =
  | ChooseElemButtonElementSpec
  | DropDownElementSpec
  | EmptyWidgetElementSpec
  | EntityPreviewElementSpec
  | ListBoxElementSpec
  | ScrollPaneElementSpec
  | SpriteButtonElementSpec
  | TabbedPaneElementSpec
  | TextBoxElementSpec
  | ButtonElementSpec
  | CameraElementSpec
  | CheckboxElementSpec
  | FlowElementSpec
  | FrameElementSpec
  | LabelElementSpec
  | LineElementSpec
  | MinimapElementSpec
  | ProgressBarElementSpec
  | RadioButtonElementSpec
  | SliderElementSpec
  | SpriteElementSpec
  | SwitchElementSpec
  | TabElementSpec
  | TableElementSpec
  | TextFieldElementSpec

export interface BaseStyleMod {
  minimal_width?: MaybeState<int>
  maximal_width?: MaybeState<int>
  minimal_height?: MaybeState<int>
  maximal_height?: MaybeState<int>
  natural_width?: MaybeState<int>
  natural_height?: MaybeState<int>
  top_padding?: MaybeState<int>
  right_padding?: MaybeState<int>
  bottom_padding?: MaybeState<int>
  left_padding?: MaybeState<int>
  top_margin?: MaybeState<int>
  right_margin?: MaybeState<int>
  bottom_margin?: MaybeState<int>
  left_margin?: MaybeState<int>
  horizontal_align?: MaybeState<"left" | "center" | "right">
  vertical_align?: MaybeState<"top" | "center" | "bottom">
  font_color?: MaybeState<Color>
  font?: MaybeState<string>
  horizontally_stretchable?: MaybeState<boolean>
  vertically_stretchable?: MaybeState<boolean>
  horizontally_squashable?: MaybeState<boolean>
  vertically_squashable?: MaybeState<boolean>
  width?: MaybeState<int>
  height?: MaybeState<int>
  size?: MaybeState<int | SizeArray>
  padding?: MaybeState<int | StyleValuesArray>
  margin?: MaybeState<int | StyleValuesArray>
}

export interface ScrollPaneStyleMod extends BaseStyleMod {
  extra_top_padding_when_activated?: MaybeState<int>
  extra_bottom_padding_when_activated?: MaybeState<int>
  extra_left_padding_when_activated?: MaybeState<int>
  extra_right_padding_when_activated?: MaybeState<int>
  extra_top_margin_when_activated?: MaybeState<int>
  extra_bottom_margin_when_activated?: MaybeState<int>
  extra_left_margin_when_activated?: MaybeState<int>
  extra_right_margin_when_activated?: MaybeState<int>
  extra_padding_when_activated?: MaybeState<int | StyleValuesArray>
  extra_margin_when_activated?: MaybeState<int | StyleValuesArray>
}

export interface TabbedPaneStyleMod extends BaseStyleMod {
  vertical_spacing?: MaybeState<int>
}

export interface TextBoxStyleMod extends BaseStyleMod {
  rich_text_setting?: MaybeState<defines.rich_text_setting>
}

export interface ButtonStyleMod extends BaseStyleMod {
  hovered_font_color?: MaybeState<Color>
  clicked_font_color?: MaybeState<Color>
  disabled_font_color?: MaybeState<Color>
  pie_progress_color?: MaybeState<Color>
  clicked_vertical_offset?: MaybeState<int>
  selected_font_color?: MaybeState<Color>
  selected_hovered_font_color?: MaybeState<Color>
  selected_clicked_font_color?: MaybeState<Color>
  strikethrough_color?: MaybeState<Color>
}

export interface FlowStyleMod extends BaseStyleMod {
  horizontal_spacing?: MaybeState<int>
  vertical_spacing?: MaybeState<int>
}

export interface FrameStyleMod extends BaseStyleMod {
  use_header_filler?: MaybeState<boolean>
}

export interface LabelStyleMod extends BaseStyleMod {
  rich_text_setting?: MaybeState<defines.rich_text_setting>
  single_line?: MaybeState<boolean>
}

export interface ProgressBarStyleMod extends BaseStyleMod {
  bar_width?: MaybeState<uint>
  color?: MaybeState<Color>
}

export interface SpriteStyleMod extends BaseStyleMod {
  stretch_image_to_widget_size?: MaybeState<boolean>
}

export interface TabStyleMod extends BaseStyleMod {
  disabled_font_color?: MaybeState<Color>
  badge_font?: MaybeState<string>
  badge_horizontal_spacing?: MaybeState<int>
  default_badge_font_color?: MaybeState<Color>
  selected_badge_font_color?: MaybeState<Color>
  disabled_badge_font_color?: MaybeState<Color>
}

export interface TableStyleMod extends BaseStyleMod {
  top_cell_padding?: MaybeState<int>
  right_cell_padding?: MaybeState<int>
  bottom_cell_padding?: MaybeState<int>
  left_cell_padding?: MaybeState<int>
  horizontal_spacing?: MaybeState<int>
  vertical_spacing?: MaybeState<int>
  cell_padding?: MaybeState<int>
}

export interface TextFieldStyleMod extends BaseStyleMod {
  rich_text_setting?: MaybeState<defines.rich_text_setting>
}
