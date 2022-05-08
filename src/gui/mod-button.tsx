import { funcRef, Functions, onPlayerInit } from "../lib"
import * as mod_gui from "mod-gui"
import { destroy, FactorioJsx, render } from "../lib/factoriojsx"
import { AssembliesOverview } from "./assemblies-overview/AssembliesOverview"

const modButtonName = `${script.mod_name}:BBPP-overview`

function toggleAssembliesOverview(event: OnGuiClickEvent) {
  const player = game.players[event.player_index]
  AssembliesOverview.toggle(player)
}
Functions.registerAll({ toggleAssembliesOverview })

onPlayerInit((player) => {
  const flow = mod_gui.get_button_flow(player)
  destroy(flow[modButtonName])
  render(
    flow,
    <button
      style={mod_gui.button_style}
      caption="B2P2"
      on_gui_click={funcRef(toggleAssembliesOverview)}
      name={modButtonName}
    />,
  )
})
