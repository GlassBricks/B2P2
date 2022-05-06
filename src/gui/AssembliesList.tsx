import { bind, bound, Classes, Func, reg } from "../lib"
import { Assembly } from "../assembly/Assembly"
import { Component, ElemProps, FactorioJsx, Spec } from "../lib/factoriojsx"
import { EnumerateSet } from "./components/EnumerateSet"
import { GuiConstants, Styles } from "../constants"

export interface AssembliesListProps extends ElemProps<"frame"> {
  filter?: Func<(assembly: Assembly) => boolean>
  onSelect?: Func<(assembly: Assembly, event: OnGuiClickEvent) => void>
}
@Classes.register()
export class AssembliesList extends Component<AssembliesListProps> {
  filter?: Func<(assembly: Assembly) => boolean>
  onSelect?: Func<(assembly: Assembly, event: OnGuiClickEvent) => void>

  render(props: AssembliesListProps): Spec {
    this.filter = props.filter
    this.onSelect = props.onSelect
    return (
      <frame style="deep_frame_in_shallow_frame" {...props}>
        <EnumerateSet
          of={Assembly.getAllAssemblies()}
          map={reg(this.assemblyButton)}
          uses="scroll-pane"
          horizontal_scroll_policy="never"
          style={Styles.ScrollPaneFakeListbox}
          styleMod={{
            minimal_height: GuiConstants.AssembliesListMinHeight,
            maximal_height: GuiConstants.AssembliesListMaxHeight,
            width: GuiConstants.AssembliesListWidth,
          }}
        />
      </frame>
    )
  }
  @bound
  private assemblyButton(assembly: Assembly) {
    return !this.filter || this.filter(assembly) ? (
      <button
        caption={assembly.displayName}
        style={Styles.ListBoxButton}
        on_gui_click={this.onSelect && bind(this.onSelect, undefined, assembly)}
      />
    ) : (
      <empty-widget />
    )
  }
}
