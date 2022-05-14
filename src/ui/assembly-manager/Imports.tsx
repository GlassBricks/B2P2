import { teleportPlayerToArea } from "../../area/teleport-history"
import { Assembly } from "../../assembly/Assembly"
import { AssemblyImportItem, LayerOptions } from "../../assembly/AssemblyContent"
import { highlightImport } from "../../assembly/imports/AssemblyImport"
import { startBasicImportCreation } from "../../assembly/imports/import-creation"
import { GuiConstants, Styles } from "../../constants"
import { bound, Classes, funcOn, funcRef, raiseUserError, reg } from "../../lib"
import { Component, destroy, FactorioJsx, GuiEvent, renderOpened, Spec, Tracker } from "../../lib/factoriojsx"
import { ObservableSet } from "../../lib/observable"
import { L_Gui, L_Interaction } from "../../locale"
import { AssembliesList } from "../AssembliesList"
import { CloseButton, DotDotDotButton, TrashButton } from "../components/buttons"
import { List } from "../components/List"
import { HorizontalPusher } from "../components/misc"
import { closeParentParent, TitleBar } from "../components/TitleBar"
import { showDialogue } from "../window/Dialog"

@Classes.register()
export class ImportsTab extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    assert(props.assembly.isValid())
    this.assembly = props.assembly
    const assemblyContent = this.assembly.getContent()!
    return (
      <flow direction="vertical">
        <frame style="deep_frame_in_shallow_frame">
          <scroll-pane style={Styles.AMListScrollPane}>
            <List
              of={assemblyContent.imports}
              map={reg(this.importItem)}
              uses="flow"
              direction="vertical"
              styleMod={{ vertical_spacing: 0 }}
            />
            <ImportItem item={undefined} options={assemblyContent.ownOptions} assembly={this.assembly} />
          </scroll-pane>
        </frame>
        <flow direction={"horizontal"}>
          <button caption={[L_Gui.AddImport]} on_gui_click={reg(this.addImport)} />
        </flow>
      </flow>
    )
  }

  @bound
  private importItem(item: AssemblyImportItem): Spec {
    return <ImportItem item={item} assembly={this.assembly} options={item} />
  }

  @bound
  private addImport(e: GuiEvent): void {
    const player = game.get_player(e.player_index)!
    ChooseImportSourceDialogue.tryOpen(player, this.assembly)
  }
}

interface ImportItemProps {
  item: AssemblyImportItem | undefined
  options: LayerOptions
  assembly: Assembly
}

@Classes.register()
class ImportItem extends Component<ImportItemProps> {
  item!: AssemblyImportItem | undefined
  assembly!: Assembly
  options!: LayerOptions

  render(props: ImportItemProps): Spec {
    this.item = props.item
    this.assembly = props.assembly
    this.options = props.options
    return (
      <frame
        style="bordered_frame"
        styleMod={{
          padding: [0, 5],
          height: GuiConstants.ImportItemHeight,
        }}
      >
        <flow
          direction="horizontal"
          styleMod={{
            vertical_align: "center",
          }}
        >
          {this.item && <checkbox state={this.item.active} tooltip={[L_Gui.ToggleImport]} />}
          {this.item ? (
            <button
              style={Styles.ListBoxButton}
              caption={this.item.import.name()}
              tooltip={[L_Gui.ImportItemTooltip]}
              on_gui_click={reg(this.nameClicked)}
            />
          ) : (
            <button style={Styles.ListBoxButton} caption={[L_Gui.OwnContents]} enabled={false} />
          )}
          <HorizontalPusher />
          <DotDotDotButton tooltip={[L_Gui.LayerAdditionalSettings]} onClick={reg(this.openAdditionalSettings)} />
          {this.item && <TrashButton tooltip={[L_Gui.DeleteImport]} onClick={reg(this.confirmDeleteImport)} />}
        </flow>
      </frame>
    )
  }

  @bound
  private nameClicked(e: OnGuiClickEvent): void {
    // shift click: move up
    // control-shift click: move down
    // no modifiers: highlight
    // control-click: teleport to source
    const item = this.item!
    if (e.button !== defines.mouse_button_type.left) return
    if (e.shift) {
      if (!e.control) {
        // move up
        const { imports, index } = this.getIndex()
        if (index <= 0) return
        imports.swap(index, index - 1)
      } else {
        // move down
        const { imports, index } = this.getIndex()
        if (index === imports.length() - 1) return
        imports.swap(index, index + 1)
      }
    } else if (e.control) {
      // teleport to source
      const source = item.import.getSourceArea()
      const player = game.get_player(e.player_index)!
      if (source) {
        teleportPlayerToArea(player, source)
      } else {
        player.create_local_flying_text({
          text: [L_Interaction.ImportHasNoSource],
          create_at_cursor: true,
        })
      }
    } else {
      const { assembly } = this
      const player = game.get_player(e.player_index)!
      highlightImport(assembly.surface, assembly.area, item.import, player)
    }
  }

  @bound
  private openAdditionalSettings(e: OnGuiClickEvent): void {
    const player = game.get_player(e.player_index)!
    renderOpened(
      player,
      <LayerAdditionalSettings
        options={this.options}
        assemblyName={this.assembly.displayName.get()}
        layerName={this.item ? this.item.import.name().get() : [L_Gui.OwnContents]}
      />,
    )
  }

  @bound
  private confirmDeleteImport(e: GuiEvent): void {
    const player = game.get_player(e.player_index)!
    showDialogue(player, {
      title: ["gui.confirmation"],
      message: [L_Gui.DeleteImportConfirmation, this.item!.import.name().get()],
      backCaption: ["gui.cancel"],
      confirmCaption: ["gui.delete"],
      redConfirm: true,
      onConfirm: reg(this.deleteImport),
    })
  }

  @bound
  private deleteImport(): void {
    const { imports, index } = this.getIndex()
    imports.remove(index)
  }

  private getIndex() {
    const imports = this.assembly.getContent()!.imports
    const index = imports.value().indexOf(this.item!)
    if (index === -1) {
      raiseUserError([L_Gui.ImportNoLongerExists], "flying-text")
    }
    return { imports, index }
  }
}

interface AdditionalImportOptionsProps {
  options: LayerOptions
  assemblyName: LocalisedString
  layerName: LocalisedString
}
@Classes.register()
class LayerAdditionalSettings extends Component<AdditionalImportOptionsProps> {
  options!: LayerOptions
  override render(props: AdditionalImportOptionsProps): Spec {
    this.options = props.options

    return (
      <frame
        direction="vertical"
        auto_center
        onCreate={(el) => {
          game.get_player(el.player_index)!.opened = el as LuaGuiElement
        }}
        on_gui_closed={reg(this.close)}
      >
        <TitleBar title={[L_Gui.LayerAdditionalSettingsTitle, props.assemblyName, props.layerName]}>
          <CloseButton onClick={funcRef(closeParentParent)} />
        </TitleBar>
        <frame
          style="inside_shallow_frame_with_padding"
          styleMod={{
            horizontally_stretchable: true,
          }}
        >
          <checkbox
            state={this.options.allowUpgrades}
            caption={[L_Gui.LayerAllowUpgrades]}
            tooltip={[L_Gui.LayerAllowUpgradesTooltip]}
          />
        </frame>
      </frame>
    )
  }

  @bound
  private close(e: OnGuiClosedEvent): void {
    destroy(e.element!)
  }
}

@Classes.register()
class ChooseImportSourceDialogue extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  element!: BaseGuiElement

  static tryOpen(player: LuaPlayer, assembly: Assembly): boolean {
    const allAssemblies = Assembly.getAllAssemblies()
    if (!ChooseImportSourceDialogue.anyAssemblyValid(assembly, allAssemblies)) {
      player.create_local_flying_text({ text: [L_Gui.NoSourceAssemblies], create_at_cursor: true })
      return false
    }
    renderOpened(player, <ChooseImportSourceDialogue assembly={assembly} />)
    return true
  }
  private static anyAssemblyValid(target: Assembly, assemblies: ObservableSet<Assembly>): boolean {
    for (const [assembly] of assemblies.value()) {
      if (target.canImport(assembly)) return true
    }
    return false
  }

  render(props: { assembly: Assembly }, tracker: Tracker): Spec {
    this.assembly = props.assembly
    tracker.onMount((el) => {
      this.element = el
    })

    return (
      <frame direction="vertical" on_gui_closed={reg(this.close)} auto_center caption={[L_Gui.ChooseImportSource]}>
        <AssembliesList
          filter={funcOn(this.assembly, "canImport")}
          onSelect={reg(this.pickAssembly)}
          style="inside_deep_frame"
          styleMod={{
            margin: [5, 0],
          }}
        />
        <flow style="dialog_buttons_horizontal_flow">
          <button style="back_button" caption={["gui.cancel"]} on_gui_click={reg(this.close)} />
        </flow>
      </frame>
    )
  }

  @bound
  private close(): void {
    destroy(this.element)
  }

  @bound
  private pickAssembly(assembly: Assembly, event: OnGuiClickEvent): void {
    const player = game.get_player(event.player_index)!
    if (event.control) {
      teleportPlayerToArea(player, assembly)
    } else {
      destroy(this.element)
      startBasicImportCreation(player, this.assembly, assembly)
    }
  }
}
