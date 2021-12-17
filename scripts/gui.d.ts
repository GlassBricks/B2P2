interface BaseGuiSpec {
  /** The kind of element to add. Has to be one of the GUI element types listed at the top of this page. */
  readonly type: GuiElementType
  /** Name of the child element. */
  readonly name?: string
  /**
   * Text displayed on the child element. For frames, this is their title. For other elements, like buttons or labels,
   * this is the content. Whilst this attribute may be used on all elements, it doesn't make sense for tables and flows
   * as they won't display it.
   */
  readonly caption?: LocalisedString
  /** Tooltip of the child element. */
  readonly tooltip?: LocalisedString
  /** Whether the child element is enabled. Defaults to `true`. */
  readonly enabled?: boolean
  /** Whether the child element is visible. Defaults to `true`. */
  readonly visible?: boolean
  /** Whether the child element is ignored by interaction. Defaults to `false`. */
  readonly ignored_by_interaction?: boolean
  /** Style of the child element. */
  readonly style?: string
  /** {@link Tags} associated with the child element. */
  readonly tags?: Tags
  /** Location in its parent that the child element should slot into. By default, the child will be appended onto the end. */
  readonly index?: uint
  /** Where to position the child element when in the `relative` element. */
  readonly anchor?: GuiAnchor
}

interface ButtonGuiSpec extends BaseGuiSpec {
  readonly type: "button"
  /** Which mouse buttons the button responds to. Defaults to `"left-and-right"`. */
  readonly mouse_button_filter?: MouseButtonFlags
}

interface FlowGuiSpec extends BaseGuiSpec {
  readonly type: "flow"
  /**
   * The initial direction of the flow's layout. See {@link LuaGuiElement.direction LuaGuiElement::direction}. Defaults
   * to `"horizontal"`.
   */
  readonly direction?: "horizontal" | "vertical"
}

interface FrameGuiSpec extends BaseGuiSpec {
  readonly type: "frame"
  /**
   * The initial direction of the frame's layout. See {@link LuaGuiElement.direction LuaGuiElement::direction}. Defaults
   * to `"horizontal"`.
   */
  readonly direction?: "horizontal" | "vertical"
}

interface TableGuiSpec extends BaseGuiSpec {
  readonly type: "table"
  /** Number of columns. This can't be changed after the table is created. */
  readonly column_count: uint
  /** Whether the table should draw vertical grid lines. Defaults to `false`. */
  readonly draw_vertical_lines?: boolean
  /** Whether the table should draw horizontal grid lines. Defaults to `false`. */
  readonly draw_horizontal_lines?: boolean
  /** Whether the table should draw a single horizontal grid line after the headers. Defaults to `false`. */
  readonly draw_horizontal_line_after_headers?: boolean
  /** Whether the content of the table should be vertically centered. Defaults to `true`. */
  readonly vertical_centering?: boolean
}

interface TextfieldGuiSpec extends BaseGuiSpec {
  readonly type: "textfield"
  /** The initial text contained in the textfield. */
  readonly text?: string
  /** Defaults to `false`. */
  readonly numeric?: boolean
  /** Defaults to `false`. */
  readonly allow_decimal?: boolean
  /** Defaults to `false`. */
  readonly allow_negative?: boolean
  /** Defaults to `false`. */
  readonly is_password?: boolean
  /** Defaults to `false`. */
  readonly lose_focus_on_confirm?: boolean
  /** Defaults to `false`. */
  readonly clear_and_focus_on_right_click?: boolean
}

interface ProgressbarGuiSpec extends BaseGuiSpec {
  readonly type: "progressbar"
  /** The initial value of the progressbar, in the range [0, 1]. Defaults to `0`. */
  readonly value?: double
}

interface CheckboxGuiSpec extends BaseGuiSpec {
  readonly type: "checkbox"
  /** The initial checked-state of the checkbox. */
  readonly state: boolean
}

interface RadiobuttonGuiSpec extends BaseGuiSpec {
  readonly type: "radiobutton"
  /** The initial checked-state of the radiobutton. */
  readonly state: boolean
}

interface SpriteButtonGuiSpec extends BaseGuiSpec {
  readonly type: "sprite-button"
  /** Path to the image to display on the button. */
  readonly sprite?: SpritePath
  /** Path to the image to display on the button when it is hovered. */
  readonly hovered_sprite?: SpritePath
  /** Path to the image to display on the button when it is clicked. */
  readonly clicked_sprite?: SpritePath
  /** The number shown on the button. */
  readonly number?: double
  /** Formats small numbers as percentages. Defaults to `false`. */
  readonly show_percent_for_small_numbers?: boolean
  /** The mouse buttons that the button responds to. Defaults to `"left-and-right"`. */
  readonly mouse_button_filter?: MouseButtonFlags
}

interface SpriteGuiSpec extends BaseGuiSpec {
  readonly type: "sprite"
  /** Path to the image to display. */
  readonly sprite?: SpritePath
  /** Whether the widget should resize according to the sprite in it. Defaults to `true`. */
  readonly resize_to_sprite?: boolean
}

interface ScrollPaneGuiSpec extends BaseGuiSpec {
  readonly type: "scroll-pane"
  /**
   * Policy of the horizontal scroll bar. Possible values are `"auto"`, `"never"`, `"always"`,
   * `"auto-and-reserve-space"`, `"dont-show-but-allow-scrolling"`. Defaults to `"auto"`.
   */
  readonly horizontal_scroll_policy?:
    | "auto"
    | "never"
    | "always"
    | "auto-and-reserve-space"
    | "dont-show-but-allow-scrolling"
  /**
   * Policy of the vertical scroll bar. Possible values are `"auto"`, `"never"`, `"always"`, `"auto-and-reserve-space"`,
   * `"dont-show-but-allow-scrolling"`. Defaults to `"auto"`.
   */
  readonly vertical_scroll_policy?:
    | "auto"
    | "never"
    | "always"
    | "auto-and-reserve-space"
    | "dont-show-but-allow-scrolling"
}

interface DropDownGuiSpec extends BaseGuiSpec {
  readonly type: "drop-down"
  /** The initial items in the dropdown. */
  readonly items?: LocalisedString[]
  /** The index of the initially selected item. Defaults to 0. */
  readonly selected_index?: uint
}

interface LineGuiSpec extends BaseGuiSpec {
  readonly type: "line"
  /** The initial direction of the line. Defaults to `"horizontal"`. */
  readonly direction?: "horizontal" | "vertical"
}

interface ListBoxGuiSpec extends BaseGuiSpec {
  readonly type: "list-box"
  /** The initial items in the listbox. */
  readonly items?: LocalisedString[]
  /** The index of the initially selected item. Defaults to 0. */
  readonly selected_index?: uint
}

interface CameraGuiSpec extends BaseGuiSpec {
  readonly type: "camera"
  /** The position the camera centers on. */
  readonly position: Position
  /** The surface that the camera will render. Defaults to the player's current surface. */
  readonly surface_index?: uint
  /** The initial camera zoom. Defaults to `0.75`. */
  readonly zoom?: double
}

type ChooseElemButtonType =
  | "item"
  | "tile"
  | "entity"
  | "signal"
  | "fluid"
  | "recipe"
  | "decorative"
  | "item-group"
  | "achievement"
  | "equipment"
  | "technology"

interface ChooseElemButtonFilters {
  item: ItemPrototypeFilter[]
  tile: TilePrototypeFilter[]
  entity: EntityPrototypeFilter[]
  signal: never
  fluid: FluidPrototypeFilter[]
  recipe: RecipePrototypeFilter[]
  decorative: DecorativePrototypeFilter[]
  "item-group": never
  achievement: AchievementPrototypeFilter[]
  equipment: EquipmentPrototypeFilter[]
  technology: TechnologyPrototypeFilter[]
}

interface BaseChooseElemButtonSpec extends BaseGuiSpec {
  readonly type: "choose-elem-button"
  /** The type of the button - one of the following values. */
  readonly elem_type: ChooseElemButtonType
  /** Filters describing what to show in the selection window. See {@link LuaGuiElement.elem_filters LuaGuiElement::elem_filters}. */
  readonly filters?: ChooseElemButtonFilters[this["elem_type"]]
}

interface ItemChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "item"
  /** If type is `"item"` - the default value for the button. */
  readonly item?: string
}

interface TileChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "tile"
  /** If type is `"tile"` - the default value for the button. */
  readonly tile?: string
}

interface EntityChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "entity"
  /** If type is `"entity"` - the default value for the button. */
  readonly entity?: string
}

interface SignalChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "signal"
  /** If type is `"signal"` - the default value for the button. */
  readonly signal?: SignalID
}

interface FluidChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "fluid"
  /** If type is `"fluid"` - the default value for the button. */
  readonly fluid?: string
}

interface RecipeChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "recipe"
  /** If type is `"recipe"` - the default value for the button. */
  readonly recipe?: string
}

interface DecorativeChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "decorative"
  /** If type is `"decorative"` - the default value for the button. */
  readonly decorative?: string
}

interface ItemGroupChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "item-group"
  /** If type is `"item-group"` - the default value for the button. */
  readonly "item-group"?: string
}

interface AchievementChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "achievement"
  /** If type is `"achievement"` - the default value for the button. */
  readonly achievement?: string
}

interface EquipmentChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "equipment"
  /** If type is `"equipment"` - the default value for the button. */
  readonly equipment?: string
}

interface TechnologyChooseElemButtonSpec extends BaseChooseElemButtonSpec {
  readonly elem_type: "technology"
  /** If type is `"technology"` - the default value for the button. */
  readonly technology?: string
}

type ChooseElemButtonGuiSpec =
  | ItemChooseElemButtonSpec
  | TileChooseElemButtonSpec
  | EntityChooseElemButtonSpec
  | SignalChooseElemButtonSpec
  | FluidChooseElemButtonSpec
  | RecipeChooseElemButtonSpec
  | DecorativeChooseElemButtonSpec
  | ItemGroupChooseElemButtonSpec
  | AchievementChooseElemButtonSpec
  | EquipmentChooseElemButtonSpec
  | TechnologyChooseElemButtonSpec

interface TextBoxGuiSpec extends BaseGuiSpec {
  readonly type: "text-box"
  /** The initial text contained in the text-box. */
  readonly text?: string
  /** Defaults to `false`. */
  readonly clear_and_focus_on_right_click?: boolean
}

interface SliderGuiSpec extends BaseGuiSpec {
  readonly type: "slider"
  /** The minimum value for the slider. Defaults to `0`. */
  readonly minimum_value?: double
  /** The maximum value for the slider. Defaults to `30`. */
  readonly maximum_value?: double
  /** The initial value for the slider. Defaults to `minimum_value`. */
  readonly value?: double
  /** The minimum value the slider can move. Defaults to `1`. */
  readonly value_step?: double
  /** Defaults to `false`. */
  readonly discrete_slider?: boolean
  /** Defaults to `true`. */
  readonly discrete_values?: boolean
}

interface MinimapGuiSpec extends BaseGuiSpec {
  readonly type: "minimap"
  /** The position the minimap centers on. Defaults to the player's current position. */
  readonly position?: Position
  /** The surface the camera will render. Defaults to the player's current surface. */
  readonly surface_index?: uint
  /** The player index the map should use. Defaults to the current player. */
  readonly chart_player_index?: uint
  /** The force this minimap should use. Defaults to the player's current force. */
  readonly force?: string
  /** The initial camera zoom. Defaults to `0.75`. */
  readonly zoom?: double
}

interface TabGuiSpec extends BaseGuiSpec {
  readonly type: "tab"
  /** The text to display after the normal tab text (designed to work with numbers). */
  readonly badge_text?: LocalisedString
}

interface SwitchGuiSpec extends BaseGuiSpec {
  readonly type: "switch"
  /**
   * Possible values are `"left"`, `"right"`, or `"none"`. If set to "none", `allow_none_state` must be `true`. Defaults
   * to `"left"`.
   */
  readonly switch_state?: "left" | "right" | "none"
  /** Whether the switch can be set to a middle state. Defaults to `false`. */
  readonly allow_none_state?: boolean
  readonly left_label_caption?: LocalisedString
  readonly left_label_tooltip?: LocalisedString
  readonly right_label_caption?: LocalisedString
  readonly right_label_tooltip?: LocalisedString
}

interface EmptyWidgetGuiSpec extends BaseGuiSpec {
  readonly type: "empty-widget"
}

interface EntityPreviewGuiSpec extends BaseGuiSpec {
  readonly type: "entity-preview"
}

interface TabbedPaneGuiSpec extends BaseGuiSpec {
  readonly type: "tabbed-pane"
}

interface LabelGuiSpec extends BaseGuiSpec {
  readonly type: "label"
}

type GuiSpec =
  | ButtonGuiSpec
  | FlowGuiSpec
  | FrameGuiSpec
  | TableGuiSpec
  | TextfieldGuiSpec
  | ProgressbarGuiSpec
  | CheckboxGuiSpec
  | RadiobuttonGuiSpec
  | SpriteButtonGuiSpec
  | SpriteGuiSpec
  | ScrollPaneGuiSpec
  | DropDownGuiSpec
  | LineGuiSpec
  | ListBoxGuiSpec
  | CameraGuiSpec
  | ChooseElemButtonGuiSpec
  | TextBoxGuiSpec
  | SliderGuiSpec
  | MinimapGuiSpec
  | TabGuiSpec
  | SwitchGuiSpec
  | EmptyWidgetGuiSpec
  | EntityPreviewGuiSpec
  | TabbedPaneGuiSpec
  | LabelGuiSpec

interface GuiElementIndex {
  /**
   * The indexing operator. Gets children by name.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.operator%20[] View documentation}
   */
  readonly [name: string]: LuaGuiElement | undefined
}

/** @noSelf */
interface BaseGuiElement {
  /**
   * Add a new child element to this GuiElement.
   *
   * Other attributes may be specified depending on `type`:
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.add View documentation}
   *
   * @returns The added GUI element.
   */
  add<Type extends GuiElementType>(
    element: GuiSpec & {
      type: Type
    },
  ): Extract<
    LuaGuiElement,
    {
      type: Type
    }
  >
  /**
   * Remove children of this element. Any {@link LuaGuiElement} objects referring to the destroyed elements become
   * invalid after this operation.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clear View documentation}
   *
   * @example
   *   ;```lua
   *     game.player.gui.top.clear()
   *     ```
   */
  clear(): void
  /**
   * Remove this element, along with its children. Any {@link LuaGuiElement} objects referring to the destroyed elements
   * become invalid after this operation.
   *
   * **Note**: The top-level GUI elements - {@link LuaGui.top LuaGui::top}, {@link LuaGui.left LuaGui::left},
   * {@link LuaGui.center LuaGui::center} and {@link LuaGui.screen LuaGui::screen} - can't be destroyed.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.destroy View documentation}
   *
   * @example
   *   ;```lua
   *     game.player.gui.top.greeting.destroy()
   *     ```
   */
  destroy(): void
  /**
   * The mod that owns this Gui element or `nil` if it's owned by the scenario script.
   *
   * **Note**: This has a not-super-expensive, but non-free cost to get.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_mod View documentation}
   */
  get_mod(): string | undefined
  /**
   * Gets the index that this element has in its parent element.
   *
   * **Note**: This iterates through the children of the parent of this element, meaning this has a non-free cost to
   * get, but is faster than doing the equivalent in Lua.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_index_in_parent View documentation}
   */
  get_index_in_parent(): uint
  /**
   * Swaps the children at the given indices in this element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.swap_children View documentation}
   *
   * @param index_1 - The index of the first child.
   * @param index_2 - The index of the second child.
   */
  swap_children(index_1: uint, index_2: uint): void
  /**
   * Focuses this GUI element if possible.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.focus View documentation}
   */
  focus(): void
  /**
   * Moves this GUI element to the "front" so it will draw over other elements.
   *
   * **Note**: Only works for elements in {@link LuaGui.screen LuaGui::screen}
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.bring_to_front View documentation}
   */
  bring_to_front(): void
  /**
   * The index of this GUI element (unique amongst the GUI elements of a LuaPlayer).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.index View documentation}
   */
  readonly index: uint
  /**
   * The GUI this element is a child of.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.gui View documentation}
   */
  readonly gui: LuaGui
  /**
   * The direct parent of this element; `nil` if this is a top-level element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.parent View documentation}
   */
  readonly parent: LuaGuiElement | undefined
  /**
   * The name of this element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.name View documentation}
   *
   * @example
   *   ;```lua
   *     game.player.gui.top.greeting.name == "greeting"
   *     ```
   */
  name: string
  /**
   * The text displayed on this element. For frames, this is the "heading". For other elements, like buttons or labels,
   * this is the content.
   *
   * **Note**: Whilst this attribute may be used on all elements without producing an error, it doesn't make sense for
   * tables and flows as they won't display it.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.caption View documentation}
   */
  caption: LocalisedString
  /**
   * The style of this element. When read, this evaluates to a {@link LuaStyle}. For writing, it only accepts a string
   * that specifies the textual identifier (prototype name) of the desired style.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.style View documentation}
   */
  set style(style: LuaStyle | string)
  get style(): LuaStyle
  /**
   * Sets whether this GUI element is visible or completely hidden, taking no space in the layout.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.visible View documentation}
   */
  visible: boolean
  /**
   * Names of all the children of this element. These are the identifiers that can be used to access the child as an
   * attribute of this element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.children_names View documentation}
   */
  readonly children_names: string[]
  /**
   * Index into {@link LuaGameScript.players LuaGameScript::players} specifying the player who owns this element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.player_index View documentation}
   */
  readonly player_index: uint
  tooltip: LocalisedString
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: GuiElementType
  /**
   * The child-elements of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.children View documentation}
   */
  readonly children: LuaGuiElement[]
  /**
   * The location of this widget when stored in {@link LuaGui.screen LuaGui::screen}, or `nil` if not set or not in
   * {@link LuaGui.screen LuaGui::screen}.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.location View documentation}
   */
  location: GuiLocation | undefined
  /**
   * Whether this GUI element is enabled. Disabled GUI elements don't trigger events when clicked.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.enabled View documentation}
   */
  enabled: boolean
  /**
   * Whether this GUI element is ignored by interaction. This makes clicks on this element 'go through' to the GUI
   * element or even the game surface below it.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.ignored_by_interaction View documentation}
   */
  ignored_by_interaction: boolean
  /**
   * Sets the anchor for this relative widget. Setting `nil` clears the anchor.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.anchor View documentation}
   */
  anchor: GuiAnchor | undefined
  /**
   * The tags associated with this LuaGuiElement.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.tags View documentation}
   */
  tags: Tags
  /**
   * Is this object valid? This Lua object holds a reference to an object within the game engine. It is possible that
   * the game-engine object is removed whilst a mod still holds the corresponding Lua object. If that happens, the
   * object becomes invalid, i.e. this attribute will be `false`. Mods are advised to check for object validity if any
   * change to the game state might have occurred between the creation of the Lua object and its access.
   */
  readonly valid: boolean
  /**
   * The class name of this object. Available even when `valid` is false. For LuaStruct objects it may also be suffixed
   * with a dotted path to a member of the struct.
   */
  readonly object_name: "LuaGuiElement"
  /** All methods and properties that this object supports. */
  help(): string
}

/** @noSelf */
interface ChooseElemButtonGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "choose-elem-button"
  /**
   * The elem type of this choose-elem-button.
   *
   * *Can only be used if this is choose-elem-button*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.elem_type View documentation}
   */
  readonly elem_type: ChooseElemButtonType
  /**
   * The elem value of this choose-elem-button or `nil` if there is no value.
   *
   * **Note**: The `"signal"` type operates with {@link SignalID}, while all other types use strings.
   *
   * *Can only be used if this is choose-elem-button*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.elem_value View documentation}
   */
  elem_value: (this["elem_type"] extends "signal" ? SignalID : string) | undefined
  /**
   * The elem filters of this choose-elem-button or `nil` if there are no filters.
   *
   * The compatible type of filter is determined by elem_type:
   *
   * - Type `"item"` - {@link ItemPrototypeFilter}
   * - Type `"tile"` - {@link TilePrototypeFilter}
   * - Type `"entity"` - {@link EntityPrototypeFilter}
   * - Type `"signal"` - Does not support filters
   * - Type `"fluid"` - {@link FluidPrototypeFilter}
   * - Type `"recipe"` - {@link RecipePrototypeFilter}
   * - Type `"decorative"` - {@link DecorativePrototypeFilter}
   * - Type `"item-group"` - Does not support filters
   * - Type `"achievement"` - {@link AchievementPrototypeFilter}
   * - Type `"equipment"` - {@link EquipmentPrototypeFilter}
   * - Type `"technology"` - {@link TechnologyPrototypeFilter}
   *
   * **Note**: Writing to this field does not change or clear the currently selected element.
   *
   * *Can only be used if this is choose-elem-button*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.elem_filters View documentation}
   *
   * @example
   *   This will configure a choose-elem-button of type `"entity"` to only show items of type `"furnace"`.
   *
   *   ```lua
   *   button.elem_filters = {{filter = "type", type = "furnace"}}
   *   ```
   *
   * @example
   *   Then, there are some types of filters that work on a specific kind of attribute. The following will configure a choose-elem-button of type `"entity"` to only show entities that have their `"hidden"` {@link EntityPrototypeFlags flags} set.
   *
   *   ```lua
   *   button.elem_filters = {{filter = "hidden"}}
   *   ```
   *
   * @example
   *   Lastly, these filters can be combined at will, taking care to specify how they should be combined (either `"and"` or `"or"`. The following will filter for any `"entities"` that are `"furnaces"` and that are not `"hidden"`.
   *
   *   ```lua
   *   button.elem_filters = {{filter = "type", type = "furnace"}, {filter = "hidden", invert = true, mode = "and"}}
   *   ```
   */
  elem_filters: ChooseElemButtonFilters[this["elem_type"]] | undefined
  /**
   * Whether this choose-elem-button can be changed by the player.
   *
   * *Can only be used if this is choose-elem-button*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.locked View documentation}
   */
  locked: boolean
}

type ChooseElemButtonGuiElement = ChooseElemButtonGuiElementMembers & GuiElementIndex

/** @noSelf */
interface DropDownGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "drop-down"
  /**
   * Removes the items in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clear_items View documentation}
   */
  clear_items(): void
  /**
   * Gets the item at the given index from this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_item View documentation}
   *
   * @param index - The index to get
   */
  get_item(index: uint): LocalisedString
  /**
   * Sets the given string at the given index in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_item View documentation}
   *
   * @param index - The index whose text to replace.
   * @param string - The text to set at the given index.
   */
  set_item(index: uint, string: LocalisedString): void
  /**
   * Inserts a string at the end or at the given index of this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.add_item View documentation}
   *
   * @param string - The text to insert.
   * @param index - The index at which to insert the item.
   */
  add_item(string: LocalisedString, index?: uint): void
  /**
   * Removes the item at the given index from this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.remove_item View documentation}
   *
   * @param index - The index
   */
  remove_item(index: uint): void
  /**
   * The items in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.items View documentation}
   */
  items: LocalisedString[]
  /**
   * The selected index for this dropdown or listbox. Returns `0` if none is selected.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.selected_index View documentation}
   */
  selected_index: uint
}

type DropDownGuiElement = DropDownGuiElementMembers & GuiElementIndex

/** @noSelf */
interface EmptyWidgetGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "empty-widget"
  /**
   * The frame drag target for this flow, frame, label, table, or empty-widget.
   *
   * **Note**: drag_target can only be set to a frame stored directly in {@link LuaGui.screen LuaGui::screen} or `nil`.
   *
   * **Note**: drag_target can only be set on child elements in {@link LuaGui.screen LuaGui::screen}.
   *
   * **Note**: drag_target can only be set to a higher level parent element (this element must be owned at some nested
   * level by the drag_target).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.drag_target View documentation}
   */
  drag_target: LuaGuiElement | undefined
}

type EmptyWidgetGuiElement = EmptyWidgetGuiElementMembers & GuiElementIndex

/** @noSelf */
interface EntityPreviewGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "entity-preview"
  /**
   * The entity associated with this entity-preview, camera, minimap or `nil` if no entity is associated.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.entity View documentation}
   */
  entity: LuaEntity | undefined
}

type EntityPreviewGuiElement = EntityPreviewGuiElementMembers & GuiElementIndex

/** @noSelf */
interface ListBoxGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "list-box"
  /**
   * Removes the items in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clear_items View documentation}
   */
  clear_items(): void
  /**
   * Gets the item at the given index from this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_item View documentation}
   *
   * @param index - The index to get
   */
  get_item(index: uint): LocalisedString
  /**
   * Sets the given string at the given index in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_item View documentation}
   *
   * @param index - The index whose text to replace.
   * @param string - The text to set at the given index.
   */
  set_item(index: uint, string: LocalisedString): void
  /**
   * Inserts a string at the end or at the given index of this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.add_item View documentation}
   *
   * @param string - The text to insert.
   * @param index - The index at which to insert the item.
   */
  add_item(string: LocalisedString, index?: uint): void
  /**
   * Removes the item at the given index from this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.remove_item View documentation}
   *
   * @param index - The index
   */
  remove_item(index: uint): void
  /**
   * Scrolls the scroll bar such that the specified listbox item is visible to the player.
   *
   * *Can only be used if this is list-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_item View documentation}
   *
   * @param index - The item index to scroll to.
   * @param scroll_mode - Where the item should be positioned in the scroll-pane. Must be either `"in-view"` or
   *   `"top-third"`. Defaults to `"in-view"`.
   */
  scroll_to_item(index: int, scroll_mode?: "in-view" | "top-third"): void
  /**
   * The items in this dropdown or listbox.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.items View documentation}
   */
  items: LocalisedString[]
  /**
   * The selected index for this dropdown or listbox. Returns `0` if none is selected.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.selected_index View documentation}
   */
  selected_index: uint
}

type ListBoxGuiElement = ListBoxGuiElementMembers & GuiElementIndex

/** @noSelf */
interface ScrollPaneGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "scroll-pane"
  /**
   * Scrolls this scroll bar to the top.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_top View documentation}
   */
  scroll_to_top(): void
  /**
   * Scrolls this scroll bar to the bottom.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_bottom View documentation}
   */
  scroll_to_bottom(): void
  /**
   * Scrolls this scroll bar to the left.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_left View documentation}
   */
  scroll_to_left(): void
  /**
   * Scrolls this scroll bar to the right.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_right View documentation}
   */
  scroll_to_right(): void
  /**
   * Scrolls this scroll bar such that the specified GUI element is visible to the player.
   *
   * *Can only be used if this is scroll-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_element View documentation}
   *
   * @param element - The element to scroll to.
   * @param scroll_mode - Where the element should be positioned in the scroll-pane. Must be either `"in-view"` or
   *   `"top-third"`. Defaults to `"in-view"`.
   */
  scroll_to_element(element: LuaGuiElement, scroll_mode?: "in-view" | "top-third"): void
  /**
   * Policy of the horizontal scroll bar. Possible values are `"auto"`, `"never"`, `"always"`,
   * `"auto-and-reserve-space"`, `"dont-show-but-allow-scrolling"`.
   *
   * *Can only be used if this is scroll-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.horizontal_scroll_policy View documentation}
   */
  horizontal_scroll_policy: "auto" | "never" | "always" | "auto-and-reserve-space" | "dont-show-but-allow-scrolling"
  /**
   * Policy of the vertical scroll bar. Possible values are `"auto"`, `"never"`, `"always"`, `"auto-and-reserve-space"`,
   * `"dont-show-but-allow-scrolling"`.
   *
   * *Can only be used if this is scroll-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.vertical_scroll_policy View documentation}
   */
  vertical_scroll_policy: "auto" | "never" | "always" | "auto-and-reserve-space" | "dont-show-but-allow-scrolling"
}

type ScrollPaneGuiElement = ScrollPaneGuiElementMembers & GuiElementIndex

/** @noSelf */
interface SpriteButtonGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "sprite-button"
  /**
   * The image to display on this sprite-button or sprite in the default state.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.sprite View documentation}
   */
  sprite: SpritePath
  /**
   * Whether the image widget should resize according to the sprite in it. Defaults to `true`.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.resize_to_sprite View documentation}
   */
  resize_to_sprite: boolean
  /**
   * The image to display on this sprite-button when it is hovered.
   *
   * *Can only be used if this is sprite-button*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.hovered_sprite View documentation}
   */
  hovered_sprite: SpritePath
  /**
   * The image to display on this sprite-button when it is clicked.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clicked_sprite View documentation}
   */
  clicked_sprite: SpritePath
  /**
   * The number to be shown in the bottom right corner of this sprite-button. Set this to `nil` to show nothing.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.number View documentation}
   */
  number: double | undefined
  /**
   * Related to the number to be shown in the bottom right corner of this sprite-button. When set to `true`, numbers
   * that are non-zero and smaller than one are shown as a percentage rather than the value. For example, `0.5` will be
   * shown as `50%` instead.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.show_percent_for_small_numbers View documentation}
   */
  show_percent_for_small_numbers: boolean
  /**
   * The mouse button filters for this button or sprite-button.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.mouse_button_filter View documentation}
   */
  mouse_button_filter: MouseButtonFlags
}

type SpriteButtonGuiElement = SpriteButtonGuiElementMembers & GuiElementIndex

/** @noSelf */
interface TabbedPaneGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "tabbed-pane"
  /**
   * Adds the given tab and content widgets to this tabbed pane as a new tab.
   *
   * *Can only be used if this is tabbed-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.add_tab View documentation}
   *
   * @param tab - The tab to add, must be a GUI element of type "tab".
   * @param content - The content to show when this tab is selected. Can be any type of GUI element.
   */
  add_tab(tab: LuaGuiElement, content: LuaGuiElement): void
  /**
   * Removes the given tab and its associated content from this tabbed pane.
   *
   * **Note**: Removing a tab does not destroy the tab or the tab contents. It just removes them from the view.
   *
   * **Note**: When removing tabs, {@link LuaGuiElement.selected_tab_index LuaGuiElement::selected_tab_index} needs to be
   * manually updated.
   *
   * *Can only be used if this is tabbed-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.remove_tab View documentation}
   *
   * @param tab - The tab to remove. If not given, it removes all tabs.
   */
  remove_tab(tab: LuaGuiElement): void
  /**
   * The selected tab index for this tabbed pane or `nil` if no tab is selected.
   *
   * *Can only be used if this is tabbed-pane*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.selected_tab_index View documentation}
   */
  selected_tab_index: uint | undefined
  /**
   * The tabs and contents being shown in this tabbed-pane.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.tabs View documentation}
   */
  readonly tabs: TabAndContent[]
}

type TabbedPaneGuiElement = TabbedPaneGuiElementMembers & GuiElementIndex

/** @noSelf */
interface TextBoxGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "text-box"
  /**
   * Scrolls this scroll bar to the top.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_top View documentation}
   */
  scroll_to_top(): void
  /**
   * Scrolls this scroll bar to the bottom.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_bottom View documentation}
   */
  scroll_to_bottom(): void
  /**
   * Scrolls this scroll bar to the left.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_left View documentation}
   */
  scroll_to_left(): void
  /**
   * Scrolls this scroll bar to the right.
   *
   * *Can only be used if this is scroll-pane or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.scroll_to_right View documentation}
   */
  scroll_to_right(): void
  /**
   * Selects all the text in this textbox.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.select_all View documentation}
   */
  select_all(): void
  /**
   * Selects a range of text in this textbox.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.select View documentation}
   *
   * @example
   *   Select the characters `amp` from `example`:
   *
   *   ```lua
   *   textbox.select(3, 5)
   *   ```
   *
   * @example
   *   Move the cursor to the start of the text box:
   *
   *   ```lua
   *   textbox.select(1, 0)
   *   ```
   *
   * @param start - The index of the first character to select
   * @param end - The index of the last character to select
   */
  select(start: int, end: int): void
  /**
   * The text contained in this textfield or text-box.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.text View documentation}
   */
  text: string
  /**
   * Whether the contents of this text-box are selectable. Defaults to `true`.
   *
   * *Can only be used if this is text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.selectable View documentation}
   */
  selectable: boolean
  /**
   * Whether this text-box will word-wrap automatically. Defaults to `false`.
   *
   * *Can only be used if this is text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.word_wrap View documentation}
   */
  word_wrap: boolean
  /**
   * Whether this text-box is read-only. Defaults to `false`.
   *
   * *Can only be used if this is text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.read_only View documentation}
   */
  read_only: boolean
  /**
   * Makes it so right-clicking on this textfield clears and focuses it.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clear_and_focus_on_right_click View documentation}
   */
  clear_and_focus_on_right_click: boolean
}

type TextBoxGuiElement = TextBoxGuiElementMembers & GuiElementIndex

/** @noSelf */
interface ButtonGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "button"
  /**
   * The mouse button filters for this button or sprite-button.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.mouse_button_filter View documentation}
   */
  mouse_button_filter: MouseButtonFlags
}

type ButtonGuiElement = ButtonGuiElementMembers & GuiElementIndex

/** @noSelf */
interface CameraGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "camera"
  /**
   * The position this camera or minimap is focused on, if any.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.position View documentation}
   */
  position: Position
  /**
   * The surface index this camera or minimap is using.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.surface_index View documentation}
   */
  surface_index: uint
  /**
   * The zoom this camera or minimap is using.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.zoom View documentation}
   */
  zoom: double
  /**
   * The entity associated with this entity-preview, camera, minimap or `nil` if no entity is associated.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.entity View documentation}
   */
  entity: LuaEntity | undefined
}

type CameraGuiElement = CameraGuiElementMembers & GuiElementIndex

/** @noSelf */
interface CheckboxGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "checkbox"
  /**
   * Is this checkbox or radiobutton checked?
   *
   * *Can only be used if this is CheckBox or RadioButton*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.state View documentation}
   */
  state: boolean
}

type CheckboxGuiElement = CheckboxGuiElementMembers & GuiElementIndex

/** @noSelf */
interface FlowGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "flow"
  /**
   * Direction of this element's layout. May be either `"horizontal"` or `"vertical"`.
   *
   * *Can only be used if this is frame, flow or line*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.direction View documentation}
   */
  readonly direction: "horizontal" | "vertical"
  /**
   * The frame drag target for this flow, frame, label, table, or empty-widget.
   *
   * **Note**: drag_target can only be set to a frame stored directly in {@link LuaGui.screen LuaGui::screen} or `nil`.
   *
   * **Note**: drag_target can only be set on child elements in {@link LuaGui.screen LuaGui::screen}.
   *
   * **Note**: drag_target can only be set to a higher level parent element (this element must be owned at some nested
   * level by the drag_target).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.drag_target View documentation}
   */
  drag_target: LuaGuiElement | undefined
}

type FlowGuiElement = FlowGuiElementMembers & GuiElementIndex

/** @noSelf */
interface FrameGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "frame"
  /**
   * Forces this frame to re-auto-center. Only works on frames stored directly in {@link LuaGui.screen LuaGui::screen}.
   *
   * *Can only be used if this is frame*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.force_auto_center View documentation}
   */
  force_auto_center(): void
  /**
   * Direction of this element's layout. May be either `"horizontal"` or `"vertical"`.
   *
   * *Can only be used if this is frame, flow or line*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.direction View documentation}
   */
  readonly direction: "horizontal" | "vertical"
  /**
   * Whether this frame auto-centers on window resize when stored in {@link LuaGui.screen LuaGui::screen}.
   *
   * *Can only be used if this is frame*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.auto_center View documentation}
   */
  auto_center: boolean
  /**
   * The frame drag target for this flow, frame, label, table, or empty-widget.
   *
   * **Note**: drag_target can only be set to a frame stored directly in {@link LuaGui.screen LuaGui::screen} or `nil`.
   *
   * **Note**: drag_target can only be set on child elements in {@link LuaGui.screen LuaGui::screen}.
   *
   * **Note**: drag_target can only be set to a higher level parent element (this element must be owned at some nested
   * level by the drag_target).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.drag_target View documentation}
   */
  drag_target: LuaGuiElement | undefined
}

type FrameGuiElement = FrameGuiElementMembers & GuiElementIndex

/** @noSelf */
interface LabelGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "label"
  /**
   * The frame drag target for this flow, frame, label, table, or empty-widget.
   *
   * **Note**: drag_target can only be set to a frame stored directly in {@link LuaGui.screen LuaGui::screen} or `nil`.
   *
   * **Note**: drag_target can only be set on child elements in {@link LuaGui.screen LuaGui::screen}.
   *
   * **Note**: drag_target can only be set to a higher level parent element (this element must be owned at some nested
   * level by the drag_target).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.drag_target View documentation}
   */
  drag_target: LuaGuiElement | undefined
}

type LabelGuiElement = LabelGuiElementMembers & GuiElementIndex

/** @noSelf */
interface LineGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "line"
  /**
   * Direction of this element's layout. May be either `"horizontal"` or `"vertical"`.
   *
   * *Can only be used if this is frame, flow or line*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.direction View documentation}
   */
  readonly direction: "horizontal" | "vertical"
}

type LineGuiElement = LineGuiElementMembers & GuiElementIndex

/** @noSelf */
interface MinimapGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "minimap"
  /**
   * The position this camera or minimap is focused on, if any.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.position View documentation}
   */
  position: Position
  /**
   * The surface index this camera or minimap is using.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.surface_index View documentation}
   */
  surface_index: uint
  /**
   * The zoom this camera or minimap is using.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.zoom View documentation}
   */
  zoom: double
  /**
   * The player index this minimap is using.
   *
   * *Can only be used if this is minimap*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.minimap_player_index View documentation}
   */
  minimap_player_index: uint
  /**
   * The force this minimap is using or `nil` if no force is set.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.force View documentation}
   */
  force: string | undefined
  /**
   * The entity associated with this entity-preview, camera, minimap or `nil` if no entity is associated.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.entity View documentation}
   */
  entity: LuaEntity | undefined
}

type MinimapGuiElement = MinimapGuiElementMembers & GuiElementIndex

/** @noSelf */
interface ProgressbarGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "progressbar"
  /**
   * How much this progress bar is filled. It is a value in the range [0, 1].
   *
   * *Can only be used if this is progressbar*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.value View documentation}
   */
  value: double
}

type ProgressbarGuiElement = ProgressbarGuiElementMembers & GuiElementIndex

/** @noSelf */
interface RadiobuttonGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "radiobutton"
  /**
   * Is this checkbox or radiobutton checked?
   *
   * *Can only be used if this is CheckBox or RadioButton*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.state View documentation}
   */
  state: boolean
}

type RadiobuttonGuiElement = RadiobuttonGuiElementMembers & GuiElementIndex

/** @noSelf */
interface SliderGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "slider"
  /**
   * Gets this sliders minimum value.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_slider_minimum View documentation}
   */
  get_slider_minimum(): double
  /**
   * Gets this sliders maximum value.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_slider_maximum View documentation}
   */
  get_slider_maximum(): double
  /**
   * Sets this sliders minimum and maximum values.
   *
   * **Note**: The minimum can't be >= the maximum.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_slider_minimum_maximum View documentation}
   *
   * @param minimum
   * @param maximum
   */
  set_slider_minimum_maximum(minimum: double, maximum: double): void
  /**
   * Gets the minimum distance this slider can move.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_slider_value_step View documentation}
   */
  get_slider_value_step(): double
  /**
   * Returns whether this slider only allows being moved to discrete positions.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_slider_discrete_slider View documentation}
   */
  get_slider_discrete_slider(): boolean
  /**
   * Returns whether this slider only allows discrete values.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.get_slider_discrete_values View documentation}
   */
  get_slider_discrete_values(): boolean
  /**
   * Sets the minimum distance this slider can move.
   *
   * **Note**: The minimum distance can't be > (max - min).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_slider_value_step View documentation}
   *
   * @param value
   */
  set_slider_value_step(value: double): void
  /**
   * Sets whether this slider only allows being moved to discrete positions.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_slider_discrete_slider View documentation}
   *
   * @param value
   */
  set_slider_discrete_slider(value: boolean): void
  /**
   * Sets whether this slider only allows discrete values.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.set_slider_discrete_values View documentation}
   *
   * @param value
   */
  set_slider_discrete_values(value: boolean): void
  /**
   * The value of this slider element.
   *
   * *Can only be used if this is slider*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.slider_value View documentation}
   */
  slider_value: double
}

type SliderGuiElement = SliderGuiElementMembers & GuiElementIndex

/** @noSelf */
interface SpriteGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "sprite"
  /**
   * The image to display on this sprite-button or sprite in the default state.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.sprite View documentation}
   */
  sprite: SpritePath
  /**
   * Whether the image widget should resize according to the sprite in it. Defaults to `true`.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.resize_to_sprite View documentation}
   */
  resize_to_sprite: boolean
}

type SpriteGuiElement = SpriteGuiElementMembers & GuiElementIndex

/** @noSelf */
interface SwitchGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "switch"
  /**
   * The switch state (left, none, right) for this switch.
   *
   * **Note**: If {@link LuaGuiElement.allow_none_state LuaGuiElement::allow_none_state} is false this can't be set to `"none"`.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.switch_state View documentation}
   */
  switch_state: string
  /**
   * Whether the `"none"` state is allowed for this switch.
   *
   * **Note**: This can't be set to false if the current switch_state is 'none'.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.allow_none_state View documentation}
   */
  allow_none_state: boolean
  /**
   * The text shown for the left switch label.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.left_label_caption View documentation}
   */
  left_label_caption: LocalisedString
  /**
   * The tooltip shown on the left switch label.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.left_label_tooltip View documentation}
   */
  left_label_tooltip: LocalisedString
  /**
   * The text shown for the right switch label.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.right_label_caption View documentation}
   */
  right_label_caption: LocalisedString
  /**
   * The tooltip shown on the right switch label.
   *
   * *Can only be used if this is switch*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.right_label_tooltip View documentation}
   */
  right_label_tooltip: LocalisedString
}

type SwitchGuiElement = SwitchGuiElementMembers & GuiElementIndex

/** @noSelf */
interface TabGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "tab"
  /**
   * The text to display after the normal tab text (designed to work with numbers)
   *
   * *Can only be used if this is tab*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.badge_text View documentation}
   */
  badge_text: LocalisedString
}

type TabGuiElement = TabGuiElementMembers & GuiElementIndex

/** @noSelf */
interface TableGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "table"
  /**
   * Whether this table should draw vertical grid lines.
   *
   * *Can only be used if this is table*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.draw_vertical_lines View documentation}
   */
  draw_vertical_lines: boolean
  /**
   * Whether this table should draw horizontal grid lines.
   *
   * *Can only be used if this is table*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.draw_horizontal_lines View documentation}
   */
  draw_horizontal_lines: boolean
  /**
   * Whether this table should draw a horizontal grid line below the first table row.
   *
   * *Can only be used if this is table*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.draw_horizontal_line_after_headers View documentation}
   */
  draw_horizontal_line_after_headers: boolean
  /**
   * The number of columns in this table.
   *
   * *Can only be used if this is table*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.column_count View documentation}
   */
  readonly column_count: uint
  /**
   * Whether the content of this table should be vertically centered. Overrides
   * {@link LuaStyle.column_alignments LuaStyle::column_alignments}. Defaults to `true`.
   *
   * *Can only be used if this is table*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.vertical_centering View documentation}
   */
  vertical_centering: boolean
  /**
   * The frame drag target for this flow, frame, label, table, or empty-widget.
   *
   * **Note**: drag_target can only be set to a frame stored directly in {@link LuaGui.screen LuaGui::screen} or `nil`.
   *
   * **Note**: drag_target can only be set on child elements in {@link LuaGui.screen LuaGui::screen}.
   *
   * **Note**: drag_target can only be set to a higher level parent element (this element must be owned at some nested
   * level by the drag_target).
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.drag_target View documentation}
   */
  drag_target: LuaGuiElement | undefined
}

type TableGuiElement = TableGuiElementMembers & GuiElementIndex

/** @noSelf */
interface TextfieldGuiElementMembers extends BaseGuiElement {
  /**
   * The type of this GUI element.
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.type View documentation}
   */
  readonly type: "textfield"
  /**
   * Selects all the text in this textbox.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.select_all View documentation}
   */
  select_all(): void
  /**
   * Selects a range of text in this textbox.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.select View documentation}
   *
   * @example
   *   Select the characters `amp` from `example`:
   *
   *   ```lua
   *   textbox.select(3, 5)
   *   ```
   *
   * @example
   *   Move the cursor to the start of the text box:
   *
   *   ```lua
   *   textbox.select(1, 0)
   *   ```
   *
   * @param start - The index of the first character to select
   * @param end - The index of the last character to select
   */
  select(start: int, end: int): void
  /**
   * The text contained in this textfield or text-box.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.text View documentation}
   */
  text: string
  /**
   * Whether this textfield is limited to only numberic characters.
   *
   * *Can only be used if this is textfield*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.numeric View documentation}
   */
  numeric: boolean
  /**
   * Whether this textfield (when in numeric mode) allows decimal numbers.
   *
   * *Can only be used if this is textfield*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.allow_decimal View documentation}
   */
  allow_decimal: boolean
  /**
   * Whether this textfield (when in numeric mode) allows negative numbers.
   *
   * *Can only be used if this is textfield*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.allow_negative View documentation}
   */
  allow_negative: boolean
  /**
   * Whether this textfield displays as a password field, which renders all characters as `*`.
   *
   * *Can only be used if this is textfield*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.is_password View documentation}
   */
  is_password: boolean
  /**
   * Whether this textfield loses focus after {@link defines.events.on_gui_confirmed} is fired.
   *
   * *Can only be used if this is textfield*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.lose_focus_on_confirm View documentation}
   */
  lose_focus_on_confirm: boolean
  /**
   * Makes it so right-clicking on this textfield clears and focuses it.
   *
   * *Can only be used if this is textfield or text-box*
   *
   * {@link https://lua-api.factorio.com/next/LuaGuiElement.html#LuaGuiElement.clear_and_focus_on_right_click View documentation}
   */
  clear_and_focus_on_right_click: boolean
}

type TextfieldGuiElement = TextfieldGuiElementMembers & GuiElementIndex

type GuiElementMembers =
  | ChooseElemButtonGuiElementMembers
  | DropDownGuiElementMembers
  | EmptyWidgetGuiElementMembers
  | EntityPreviewGuiElementMembers
  | ListBoxGuiElementMembers
  | ScrollPaneGuiElementMembers
  | SpriteButtonGuiElementMembers
  | TabbedPaneGuiElementMembers
  | TextBoxGuiElementMembers
  | ButtonGuiElementMembers
  | CameraGuiElementMembers
  | CheckboxGuiElementMembers
  | FlowGuiElementMembers
  | FrameGuiElementMembers
  | LabelGuiElementMembers
  | LineGuiElementMembers
  | MinimapGuiElementMembers
  | ProgressbarGuiElementMembers
  | RadiobuttonGuiElementMembers
  | SliderGuiElementMembers
  | SpriteGuiElementMembers
  | SwitchGuiElementMembers
  | TabGuiElementMembers
  | TableGuiElementMembers
  | TextfieldGuiElementMembers

/**
 * An element of a custom GUI. This type is used to represent any kind of a GUI element - labels, buttons and frames are
 * all instances of this type. Just like {@link LuaEntity}, different kinds of elements support different attributes;
 * attempting to access an attribute on an element that doesn't support it (for instance, trying to access the
 * `column_count` of a `textfield`) will result in a runtime error.
 *
 * The following types of GUI element are supported:
 *
 * - `"button"`: A clickable element. Relevant event: {@link OnGuiClickEvent on_gui_click}
 * - `"sprite-button"`: A `button` that displays a sprite rather than text. Relevant event: {@link OnGuiClickEvent on_gui_click}
 * - `"checkbox"`: A clickable element with a check mark that can be turned off or on. Relevant event:
 *   {@link OnGuiCheckedStateChangedEvent on_gui_checked_state_changed}
 * - `"flow"`: An invisible container that lays out its children either horizontally or vertically.
 * - `"frame"`: A non-transparent box that contains other elements. It can have a title (set via the `caption` attribute).
 *   Just like a `flow`, it lays out its children either horizontally or vertically. Relevant event:
 *   {@link OnGuiLocationChangedEvent on_gui_location_changed}
 * - `"label"`: A piece of text.
 * - `"line"`: A horizontal or vertical separation line.
 * - `"progressbar"`: A partially filled bar that can be used to indicate progress.
 * - `"table"`: An invisible container that lays out its children in a specific number of columns. The width of each
 *   column is determined by the widest element it contains.
 * - `"textfield"`: A single-line box the user can type into. Relevant events:
 *   {@link OnGuiTextChangedEvent on_gui_text_changed}, {@link OnGuiConfirmedEvent on_gui_confirmed}
 * - `"radiobutton"`: A clickable element that is functionally identical to a `checkbox`, but has a circular appearance.
 *   Relevant event: {@link OnGuiCheckedStateChangedEvent on_gui_checked_state_changed}
 * - `"sprite"`: An element that shows an image.
 * - `"scroll-pane"`: An invisible element that is similar to a `flow`, but has the ability to show and use scroll bars.
 * - `"drop-down"`: A drop-down containing strings of text. Relevant event:
 *   {@link OnGuiSelectionStateChangedEvent on_gui_selection_state_changed}
 * - `"list-box"`: A list of strings, only one of which can be selected at a time. Shows a scroll bar if necessary.
 *   Relevant event: {@link OnGuiSelectionStateChangedEvent on_gui_selection_state_changed}
 * - `"camera"`: A camera that shows the game at the given position on the given surface. It can visually track an
 *   {@link LuaGuiElement.entity entity} that is set after the element has been created.
 * - `"choose-elem-button"`: A button that lets the player pick from a certain kind of prototype, with optional filtering.
 *   Relevant event: {@link OnGuiElemChangedEvent on_gui_elem_changed}
 * - `"text-box"`: A multi-line `textfield`. Relevant event: {@link OnGuiTextChangedEvent on_gui_text_changed}
 * - `"slider"`: A horizontal number line which can be used to choose a number. Relevant event:
 *   {@link OnGuiValueChangedEvent on_gui_value_changed}
 * - `"minimap"`: A minimap preview, similar to the normal player minimap. It can visually track an
 *   {@link LuaGuiElement.entity entity} that is set after the element has been created.
 * - `"entity-preview"`: A preview of an entity. The {@link LuaGuiElement.entity entity} has to be set after the element
 *   has been created.
 * - `"empty-widget"`: An empty element that just exists. The root GUI elements `screen` and `relative` are `empty-widget`s.
 * - `"tabbed-pane"`: A collection of `tab`s and their contents. Relevant event:
 *   {@link OnGuiSelectedTabChangedEvent on_gui_selected_tab_changed}
 * - `"tab"`: A tab for use in a `tabbed-pane`.
 * - `"switch"`: A switch with three possible states. Can have labels attached to either side. Relevant event:
 *   {@link OnGuiSwitchStateChangedEvent on_gui_switch_state_changed}
 *
 * Each GUI element allows access to its children by having them as attributes. Thus, one can use the `parent.child`
 * syntax to refer to children. Lua also supports the `parent["child"]` syntax to refer to the same element. This can be
 * used in cases where the child has a name that isn't a valid Lua identifier.
 *
 * {@link https://lua-api.factorio.com/next/LuaGuiElement.html View documentation}
 *
 * @example
 *   This will add a label called `greeting` to the top flow. Immediately after, it will change its text to illustrate accessing child elements.
 *
 *   ```lua
 *   game.player.gui.top.add{type="label", name="greeting", caption="Hi"}
 *   game.player.gui.top.greeting.caption = "Hello there!"
 *   game.player.gui.top["greeting"].caption = "Actually, never mind, I don't like your face"
 *   ```
 *
 * @example
 *   This will add a tabbed-pane and 2 tabs with contents.
 *
 *   ```lua
 *   local tabbed_pane = game.player.gui.top.add{type="tabbed-pane"}
 *   local tab1 = tabbed_pane.add{type="tab", caption="Tab 1"}
 *   local tab2 = tabbed_pane.add{type="tab", caption="Tab 2"}
 *   local label1 = tabbed_pane.add{type="label", caption="Label 1"}
 *   local label2 = tabbed_pane.add{type="label", caption="Label 2"}
 *   tabbed_pane.add_tab(tab1, label1)
 *   tabbed_pane.add_tab(tab2, label2)
 *   ```
 */
type LuaGuiElement = GuiElementMembers & GuiElementIndex
