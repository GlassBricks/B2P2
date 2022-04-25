import { bound, Classes } from "../lib"
import { Component, FactorioJsx, Spec } from "../lib/factoriojsx"
import { Enumerate } from "../lib/gui/Enumerate"
import { SimpleWindowFrame } from "../lib/gui/SimpleWindowFrame"
import { addWindow } from "../lib/gui/Window"
import { Assembly } from "../assembly/Assembly"
import { GuiParameters, Styles } from "../constants"
import { L_Gui } from "../locale"
import { startAssemblyCreation } from "../assembly/creation"

@Classes.register()
export class AssembliesList implements Component {
  declare props: unknown

  render(): Spec {
    return (
      <SimpleWindowFrame
        title={[L_Gui.AssemblyListTitle]}
        auto_center
        styleMod={{
          width: GuiParameters.AssembliesListWidth,
        }}
      >
        <frame style="inside_shallow_frame" direction="vertical">
          <frame
            style="deep_frame_in_shallow_frame"
            styleMod={{
              padding: 4,
            }}
          >
            <Enumerate
              of={Assembly.getAllAssemblies()}
              map={this.assemblyButton}
              ifEmpty={<label style="bold_label" caption={[L_Gui.NoAssemblies]} />}
              uses="scroll-pane"
              direction="vertical"
              styleMod={{
                maximal_height: GuiParameters.AssembliesListMaxHeight,
                horizontally_stretchable: true,
              }}
            />
          </frame>
          <flow
            direction="vertical"
            styleMod={{
              padding: 8,
            }}
          >
            <button caption={[L_Gui.NewAssembly]} on_gui_click={this.newAssembly} />
          </flow>
        </frame>
      </SimpleWindowFrame>
    )
  }
  @bound
  private assemblyButton(assembly: Assembly) {
    return <button caption={assembly.name} style={Styles.ListBoxButton} />
  }

  @bound
  private newAssembly(event: OnGuiClickEvent) {
    startAssemblyCreation(game.players[event.player_index])
  }
}

addWindow("assemblies-list", <AssembliesList />)
