type GuiEventName = Extract<keyof typeof defines.events, `on_gui_${string}`>

export interface ButtonEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface SpriteButtonEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface CheckboxEvents {
  on_gui_click: true
  on_gui_checked_state_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface FlowEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface FrameEvents {
  on_gui_click: true
  on_gui_location_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface LabelEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface LineEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface ProgressBarEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface TableEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface TextFieldEvents {
  on_gui_click: true
  on_gui_confirmed: true
  on_gui_text_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface RadioButtonEvents {
  on_gui_click: true
  on_gui_checked_state_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface SpriteEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface ScrollPaneEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface DropDownEvents {
  on_gui_click: true
  on_gui_selection_state_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface ListBoxEvents {
  on_gui_click: true
  on_gui_selection_state_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface CameraEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface ChooseElemButtonEvents {
  on_gui_click: true
  on_gui_elem_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface TextBoxEvents {
  on_gui_click: true
  on_gui_confirmed: true
  on_gui_text_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface SliderEvents {
  on_gui_click: true
  on_gui_value_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface MinimapEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface EntityPreviewEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface EmptyWidgetEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface TabbedPaneEvents {
  on_gui_click: true
  on_gui_selected_tab_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface TabEvents {
  on_gui_click: true
  on_gui_opened: true
  on_gui_closed: true
}

export interface SwitchEvents {
  on_gui_click: true
  on_gui_switch_state_changed: true
  on_gui_opened: true
  on_gui_closed: true
}

export type GuiEventProps<Events> = {
  [K in keyof Events]?: K extends keyof typeof defines.events
    ? (this: void, data: typeof defines.events[K]["_eventData"]) => void
    : never
}
