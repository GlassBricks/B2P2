import { bound, Classes, reg } from "../../lib"
import { Assembly } from "../../assembly/Assembly"
import { Component, FactorioJsx, Spec } from "../../lib/factoriojsx"
import { TeleportButton } from "../components/buttons"
import { L_Gui } from "../../locale"

@Classes.register()
export class AMSubframeButtons extends Component {
  assembly!: Assembly

  render(props: { assembly: Assembly }): Spec {
    this.assembly = props.assembly

    return (
      <frame
        style="subheader_frame"
        direction="horizontal"
        styleMod={{
          horizontally_stretchable: true,
          left_padding: 20,
        }}
      >
        <TeleportButton tooltip={[L_Gui.TeleportToAssembly]} onClick={reg(this.teleport)} />
      </frame>
    )
  }

  @bound
  private teleport(e: OnGuiClickEvent) {
    this.assembly.teleportPlayer(game.get_player(e.player_index)!)
  }
}
