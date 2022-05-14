import * as mod_gui from "mod-gui"
import { Assembly } from "../assembly/Assembly"
import { startAssemblyCreationFromEvent } from "../assembly/assembly-creation"
import { assemblyAtPlayerLocation } from "../assembly/player-tracking"
import { bound, Callback, Classes, funcOn, funcRef, onPlayerInit, reg } from "../lib"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../lib/factoriojsx"
import { state } from "../lib/observable"
import { L_Gui } from "../locale"
import { AssembliesOverview } from "./AssembliesOverview"
import { openAssemblyManager } from "./assembly-manager"
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
          />
        </TitleBar>
        <flow direction="horizontal">
          <button caption={[L_Gui.AllAssemblies]} on_gui_click={reg(this.openAssemblyList)} />
          <button caption={[L_Gui.NewAssembly]} on_gui_click={funcRef(startAssemblyCreationFromEvent)} />
        </flow>
      </frame>
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
}
export function renderCurrentAssemblyFrame(player: LuaPlayer): void {
  const frameFlow = mod_gui.get_frame_flow(player)
  destroy(frameFlow[modFrameName])
  render(frameFlow, <CurrentAssembly player={player} />)
}
onPlayerInit((player) => {
  renderCurrentAssemblyFrame(player)
})
