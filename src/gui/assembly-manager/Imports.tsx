import { bound, Classes, funcOn, reg } from "../../lib"
import { Component, destroy, FactorioJsx, GuiEvent, renderOpened, Spec, Tracker } from "../../lib/factoriojsx"
import { Assembly } from "../../assembly/Assembly"
import { List } from "../components/List"
import { L_Gui } from "../../locale"
import { startBasicImportCreation } from "../../assembly/imports/import-creation"
import { AssembliesList } from "../AssembliesList"
import { AssemblyImport, highlightImport } from "../../assembly/imports/AssemblyImport"
import { GuiConstants, Styles } from "../../constants"
import { HorizontalPusher } from "../components/misc"
import { TrashButton } from "../components/buttons"
import { showDialogue } from "../window/Dialogue"
import { ObservableSet } from "../../lib/observable/ObservableSet"

@Classes.register()
export class ImportsTab extends Component<{ assembly: Assembly }> {
  assembly!: Assembly
  render(props: { assembly: Assembly }): Spec {
    assert(props.assembly.isValid())
    this.assembly = props.assembly
    return (
      <flow direction="vertical">
        <frame style="deep_frame_in_shallow_frame">
          <scroll-pane style={Styles.AMListScrollPane}>
            <List
              uses="flow"
              direction="vertical"
              of={this.assembly.getContent()!.imports}
              map={reg(this.importItem)}
            />
          </scroll-pane>
        </frame>
        <flow direction={"horizontal"}>
          <button caption={[L_Gui.AddImport]} on_gui_click={reg(this.addImport)} />
        </flow>
      </flow>
    )
  }

  @bound
  private importItem(item: AssemblyImport): Spec {
    return <ImportItem import={item} assembly={this.assembly} />
  }

  @bound
  private addImport(e: GuiEvent): void {
    const player = game.get_player(e.player_index)!
    ChooseImportSourceDialogue.tryOpen(player, this.assembly)
  }
}

interface ImportItemProps {
  import: AssemblyImport
  assembly: Assembly
}

@Classes.register()
class ImportItem extends Component<ImportItemProps> {
  props!: ImportItemProps

  render(props: ImportItemProps): Spec {
    this.props = props
    return (
      <frame
        style="bordered_frame"
        styleMod={{
          height: GuiConstants.ImportItemHeight,
          vertical_align: "center",
        }}
        direction="horizontal"
      >
        <button
          style="list_box_item"
          caption={props.import.getName()}
          tooltip={[L_Gui.ImportItemTooltip]}
          on_gui_click={reg(this.nameClicked)}
        />
        <HorizontalPusher />
        <TrashButton tooltip={[L_Gui.DeleteImport]} onClick={reg(this.confirmDeleteImport)} />
      </frame>
    )
  }

  @bound
  private nameClicked(e: OnGuiClickEvent): void {
    // control click: move up
    // shift click: move down
    // no modifiers: highlight
    if (e.button !== defines.mouse_button_type.left) return
    if (e.control) {
      const { imports, index } = this.getIndex()
      if (index <= 0) return
      imports.swap(index, index - 1)
    } else if (e.shift) {
      const { imports, index } = this.getIndex()
      if (index === -1 || index === imports.length() - 1) return
      imports.swap(index, index + 1)
    } else {
      const { assembly, import: imp } = this.props
      const player = game.get_player(e.player_index)!
      highlightImport(assembly.surface, assembly.area, imp, player)
    }
  }

  private getIndex() {
    const imports = this.props.assembly.getContent()!.imports
    const index = imports.value().indexOf(this.props.import)
    return { imports, index }
  }
  @bound
  private confirmDeleteImport(e: GuiEvent): void {
    const player = game.get_player(e.player_index)!
    showDialogue(player, {
      title: ["gui.confirmation"],
      message: [L_Gui.DeleteImportConfirmation, this.props.import.getName().get()],
      backCaption: ["gui.cancel"],
      confirmCaption: ["gui.delete"],
      redConfirm: true,
      onConfirm: reg(this.deleteImport),
    })
  }

  @bound
  private deleteImport(): void {
    const imports = this.props.assembly.getContent()!.imports
    const index = imports.value().indexOf(this.props.import)
    if (index === -1) {
      // should not happen
      return
    }
    imports.remove(index)
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
      assembly.teleportPlayer(player)
    } else {
      destroy(this.element)
      startBasicImportCreation(player, this.assembly, assembly)
    }
  }
}
