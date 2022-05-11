import { bound, Callback, Classes, funcOn, funcRef, Functions, onPlayerInit, reg } from "../lib"
import * as mod_gui from "mod-gui"
import { Component, destroy, FactorioJsx, render, Spec, Tracker } from "../lib/factoriojsx"
import { AssembliesOverview } from "./assemblies-overview/AssembliesOverview"
import { L_Gui } from "../locale"
import { Assembly } from "../assembly/Assembly"
import { State, state } from "../lib/observable"
import { assemblyAtPlayerLocation } from "../assembly/player-tracking"
import { TitleBar } from "./components/TitleBar"
import { openAssemblyManager } from "./assembly-manager"

const modButtonName = `${script.mod_name}:assemblies-overview`
const modFrameName = `${script.mod_name}:current-assembly`

function toggleAssembliesOverview(event: OnGuiClickEvent) {
  const player = game.players[event.player_index]
  AssembliesOverview.toggle(player)
}

function nameOfAssembly(assembly: Assembly | undefined): State<LocalisedString> | LocalisedString {
  if (!assembly) return L_Gui.None
  return assembly.displayName
}

Functions.registerAll({ toggleAssembliesOverview, nameOfAssembly })

onPlayerInit((player) => {
  const buttonFlow = mod_gui.get_button_flow(player)
  destroy(buttonFlow[modButtonName])
  render(
    buttonFlow,
    <button
      style={mod_gui.button_style}
      caption="B2P2"
      tooltip={[L_Gui.ShowAllAssemblies]}
      on_gui_click={funcRef(toggleAssembliesOverview)}
      name={modButtonName}
    />,
  )

  const frameFlow = mod_gui.get_frame_flow(player)
  destroy(frameFlow[modFrameName])
  render(frameFlow, <CurrentAssembly player={player} />)
})

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
      <frame style={mod_gui.frame_style} name={modFrameName}>
        <TitleBar title={[L_Gui.CurrentAssembly]}>
          <button
            style="list_box_item"
            caption={this.currentName}
            on_gui_click={reg(this.openAssemblyManager)}
            enabled={assemblyState.truthy()}
          />
        </TitleBar>
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
    }
  }

  @bound
  private openAssemblyManager() {
    const assembly = assemblyAtPlayerLocation(this.player.index).get()
    if (assembly && assembly.isValid()) openAssemblyManager(this.player, assembly)
  }
}
