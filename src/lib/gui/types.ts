import { ModableKeys } from "../util-types"
import { ValueOrObservable } from "../value"

export type Element = {
  [T in GuiElementType]: Extract<GuiElementMembers, { type: T }>
}
export type Spec = {
  [T in GuiElementType]: Extract<GuiSpec, { type: T }>
}

// type AddOnlyKeys<T extends GuiElementType> = Exclude<keyof Spec[T], ModableKeys<Element[T]> | "index">
// type BothKeys<T extends GuiElementType> = Extract<keyof Spec[T], ModableKeys<Element[T]>>
// type ElementOnlyKeys<T extends GuiElementType> = Exclude<ModableKeys<Element[T]>, keyof Spec[T]>

// todo: getters and setters
// todo: properties

type AddOnlyProps<T extends GuiElementType> = {
  [P in keyof Spec[T]]: P extends ModableKeys<Element[T]> ? ValueOrObservable<Spec[T][P]> : Spec[T][P]
} & { type: T }

type ModifiableProps<T extends GuiElementType> = {
  readonly [P in ModableKeys<Element[T]>]?: ValueOrObservable<Element[T][P]>
}
export type SpecProps<T extends GuiElementType> = Omit<AddOnlyProps<T>, "index"> & ModifiableProps<T>

export const addProps: {
  [T in GuiElementType]: Record<Exclude<keyof Spec[T], keyof GuiSpec>, true>
} = {
  "choose-elem-button": {
    elem_type: true,
    filters: true,
  },
  "drop-down": {
    items: true,
    selected_index: true,
  },
  "empty-widget": {},
  "entity-preview": {},
  "list-box": {
    items: true,
    selected_index: true,
  },
  "scroll-pane": {
    horizontal_scroll_policy: true,
    vertical_scroll_policy: true,
  },
  "sprite-button": {
    clicked_sprite: true,
    hovered_sprite: true,
    mouse_button_filter: true,
    number: true,
    show_percent_for_small_numbers: true,
    sprite: true,
  },
  "tabbed-pane": {},
  "text-box": {
    clear_and_focus_on_right_click: true,
    text: true,
  },
  button: {
    mouse_button_filter: true,
  },
  camera: {
    position: true,
    surface_index: true,
    zoom: true,
  },
  checkbox: {
    state: true,
  },
  flow: {
    direction: true,
  },
  frame: {
    direction: true,
  },
  label: {},
  line: {
    direction: true,
  },
  minimap: { chart_player_index: true, force: true, position: true, surface_index: true, zoom: true },
  progressbar: { value: true },
  radiobutton: { state: true },
  slider: {
    discrete_slider: true,
    discrete_values: true,
    maximum_value: true,
    minimum_value: true,
    value: true,
    value_step: true,
  },
  sprite: {
    resize_to_sprite: true,
    sprite: true,
  },
  switch: {
    allow_none_state: true,
    left_label_caption: true,
    left_label_tooltip: true,
    right_label_caption: true,
    right_label_tooltip: true,
    switch_state: true,
  },
  tab: {
    badge_text: true,
  },
  table: {
    column_count: true,
    draw_horizontal_line_after_headers: true,
    draw_horizontal_lines: true,
    draw_vertical_lines: true,
    vertical_centering: true,
  },
  textfield: {
    allow_decimal: true,
    allow_negative: true,
    clear_and_focus_on_right_click: true,
    is_password: true,
    lose_focus_on_confirm: true,
    numeric: true,
    text: true,
  },
}

export const commonAddProps: Record<keyof GuiSpec, true> = {
  type: true,
  anchor: true,
  caption: true,
  enabled: true,
  ignored_by_interaction: true,
  index: true,
  name: true,
  style: true,
  tags: true,
  tooltip: true,
  visible: true,
}

export const addOnlyProps: {
  [T in GuiElementType]: Record<Exclude<keyof Spec[T], ModableKeys<Element[T]> | "index" | "type">, true>
} = {
  "choose-elem-button": { filters: true, elem_type: true },
  "drop-down": {},
  "empty-widget": {},
  "entity-preview": {},
  "list-box": {},
  "scroll-pane": {},
  "sprite-button": {},
  "tabbed-pane": {},
  "text-box": {},
  button: {},
  camera: {},
  checkbox: {},
  flow: {
    direction: true,
  },
  frame: {
    direction: true,
  },
  label: {},
  line: { direction: true },
  minimap: { chart_player_index: true },
  progressbar: {},
  radiobutton: {},
  slider: {
    discrete_slider: true,
    discrete_values: true,
    maximum_value: true,
    minimum_value: true,
    value: true,
    value_step: true,
  },
  sprite: {},
  switch: {},
  tab: {},
  table: {
    column_count: true,
  },
  textfield: {},
}
