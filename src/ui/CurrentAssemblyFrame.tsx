import * as mod_gui from "mod-gui"
import { Assembly } from "../assembly/Assembly"
import { assemblyAtPlayerLocation } from "../assembly/player-tracking"
import { GuiConstants } from "../constants"
import { bound, Callback, Classes, Events, funcOn, onPlayerInit, reg } from "../lib"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../lib/factoriojsx"
import { state } from "../lib/observable"
import { L_Gui } from "../locale"
import { AssembliesOverview } from "./AssembliesOverview"
import { openAssemblyManager } from "./assembly-manager"
import { ResetButton, SaveButton } from "./assembly-manager/SaveButtons"
import { Fn } from "./components/Fn"
import { HorizontalPusher } from "./components/misc"
import { TitleBar } from "./components/TitleBar"

const modFrameName = `${script.mod_name}:current-assembly`
@Classes.register()
class CurrentAssembly extends Component<{ player: LuaPlayer }> {
  currentName = state<LocalisedString>("")
  player!: LuaPlayer

  render(props: { player: LuaPlayer }, tracker: Tracker): Spec {
    this.player = props.player
    const assemblyState = assemblyAtPlayerLocation(props.player.index)
    const unsub = assemblyState.subscribeAndFire(reg(this.assemblyChangedListener))
    tracker.onDestroy(unsub)

    return (
      <frame style={mod_gui.frame_style} name={modFrameName} direction="vertical">
        <TitleBar title={[L_Gui.CurrentAssembly]}>
          <button
            style="list_box_item"
            caption={this.currentName}
            on_gui_click={reg(this.openAssemblyManager)}
            enabled={assemblyState.truthy()}
            tooltip={[L_Gui.OpenAssemblyManager]}
          />
        </TitleBar>
        <flow direction="vertical">
          <Fn uses="flow" direction="horizontal" from={assemblyState} map={reg(this.showSaveButtons)} />
          <button caption={[L_Gui.AllAssemblies]} on_gui_click={reg(this.openAssemblyList)} />
        </flow>
      </frame>
    )
  }

  @bound
  showSaveButtons(assembly: Assembly | undefined): Spec {
    if (!assembly)
      return (
        <empty-widget
          styleMod={{
            height: GuiConstants.SaveResetButtonHeight,
          }}
        />
      )
    return (
      <>
        <HorizontalPusher />
        <SaveButton assembly={assembly} />
        <ResetButton assembly={assembly} />
      </>
    )
  }

  //todo: move some of this to lib
  private lastSubscription: Callback | undefined

  @bound
  private assemblyChangedListener(assembly: Assembly | undefined) {
    this.lastSubscription?.()
    if (assembly) {
      this.lastSubscription = assembly.displayName.subscribeAndFire(funcOn(this.currentName, "set"))
    } else {
      this.currentName.set([L_Gui.None])
      this.lastSubscription = undefined
    }
  }

  @bound
  private openAssemblyManager() {
    const assembly = assemblyAtPlayerLocation(this.player.index).get()
    if (assembly && assembly.isValid()) openAssemblyManager(this.player, assembly)
  }

  @bound
  private openAssemblyList() {
    AssembliesOverview.toggle(this.player)
  }

  override onDestroy() {
    this.lastSubscription?.()
  }
}
function renderCurrentAssemblyFrame(player: LuaPlayer): void {
  const frameFlow = mod_gui.get_frame_flow(player)
  destroy(frameFlow[modFrameName])
  render(frameFlow, <CurrentAssembly player={player} />)

  // hacky fix for editor window blocking
  // game usually does this on its own
  player.gui.left.style.left_margin ??= 474
}
function destroyCurrentAssemblyFrame(player: LuaPlayer): void {
  const frameFlow = mod_gui.get_frame_flow(player)
  destroy(frameFlow[modFrameName])
}

function setFrame(player: LuaPlayer) {
  const isEditor = player.controller_type === defines.controllers.editor
  if (isEditor) {
    renderCurrentAssemblyFrame(player)
  } else {
    destroyCurrentAssemblyFrame(player)
  }
}
Events.onAll({
  on_player_toggled_map_editor(event) {
    setFrame(game.get_player(event.player_index)!)
  },
  on_configuration_changed(data) {
    if (data.mod_changes[script.mod_name]?.old_version)
      for (const [, player] of game.players) {
        setFrame(player)
      }
  },
})
onPlayerInit(setFrame)
